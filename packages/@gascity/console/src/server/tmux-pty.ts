/**
 * tmux-backed PTY bridge.
 *
 * Spawns a `tmux attach -t <name>` in a pseudo-terminal and pipes data both ways:
 *   browser (WebSocket text/binary frames)  <->  tmux PTY
 *
 * The browser speaks xterm.js protocol:
 *   - text frame starting with `{"type":"resize",...}`  ->  pty.resize()
 *   - any other text frame                              ->  pty.write()
 *   - any binary frame                                  ->  pty.write(utf8)
 *
 * The server sends raw PTY output back as text frames (or as binary if the
 * client set `binaryType = "arraybuffer"`; we always send strings here to keep
 * the protocol simple — xterm.js accepts both).
 *
 * Security:
 *   - Session name is validated by the caller (Vite plugin) with a strict regex.
 *   - `TMUX_BIN` is validated against `[a-zA-Z0-9_/.-]+` to prevent argument
 *     injection (the regex is applied by the caller, not here).
 *   - `process.env` is NOT inherited by the child; only a small allow-list is
 *     passed to avoid leaking API keys / tokens to anything that can attach
 *     to the session.
 *   - Hard caps on cols/rows prevent pathological resize values.
 */

// The `ws` package doesn't ship types directly; they're in @types/ws.
// Using `import type { WebSocket } from "ws"` is the right shape at runtime
// but TypeScript's module resolution can land on the DOM `WebSocket` if the
// `vite-env.d.ts` ambient declaration shadows the package. We resolve via
// the `WebSocket` namespace import of the `ws` package, which @types/ws
// exports as a class extending EventEmitter (so `.on("message", ...)` works).
import type { WebSocket as WsWebSocket } from "ws";

export interface TmuxPtyOptions {
  /** tmux session name to attach to. */
  name: string;
  /** Initial terminal columns (10..512). */
  cols: number;
  /** Initial terminal rows (5..256). */
  rows: number;
  /** Override the tmux binary (default: "tmux"). Already validated by caller. */
  tmuxBin?: string;
  /** Override the working directory. */
  cwd?: string;
  /** Override TERM (default: xterm-256color). */
  term?: string;
  /**
   * Called for every chunk of PTY output. May be sync or async; thrown errors
   * are treated as a closed socket.
   */
  onData: (chunk: string) => void;
  /** Called once when tmux exits (e.g. session destroyed, binary missing). */
  onExit: (info: { exitCode: number; signal?: number }) => void;
}

/** Minimal interface we rely on from node-pty (avoids hard import for type-check). */
export interface IPty {
  onData(cb: (data: string) => void): void;
  onExit(cb: (e: { exitCode: number; signal?: number }) => void): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(signal?: string): void;
  pid: number;
}

export interface IPtyModule {
  spawn(file: string, args: string[], opts: Record<string, unknown>): IPty;
}

export class TmuxPtyUnavailableError extends Error {
  readonly code = "TMUX_PTY_UNAVAILABLE";
  constructor(message: string) {
    super(message);
    this.name = "TmuxPtyUnavailableError";
  }
}

/** Hard cap on the buffer we read from a single PTY chunk before yielding. */
const MAX_CHUNK_BYTES = 64 * 1024;

/** A trimmed-down environment passed to tmux — never inherits process.env. */
const SAFE_ENV: Record<string, string> = {
  TERM: "xterm-256color",
  COLORTERM: "truecolor",
  HOME: process.env.HOME ?? "/tmp",
  PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
  LANG: process.env.LANG ?? "C.UTF-8",
  LC_ALL: process.env.LC_ALL ?? "C.UTF-8",
  // tmux uses these to render — see `man tmux`.
  TMUX_TMPDIR: process.env.TMUX_TMPDIR ?? "",
  USER: process.env.USER ?? "",
  SHELL: process.env.SHELL ?? "/bin/sh",
};

/**
 * Resolve and dynamically import a node-pty implementation. The prebuilt
 * multiarch fork is preferred so the dev container doesn't need node-gyp;
 * the canonical `node-pty` is used as a fallback.
 */
export async function loadPty(): Promise<IPtyModule> {
  const candidates = [
    () => import("@homebridge/node-pty-prebuilt-multiarch"),
    () => import("node-pty"),
  ] as const;
  let lastErr: unknown = null;
  for (const load of candidates) {
    try {
      const mod = (await load()) as unknown as { default?: IPtyModule } & IPtyModule;
      const pty: IPtyModule = (mod.default ?? mod) as IPtyModule;
      if (typeof pty.spawn === "function") return pty;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new TmuxPtyUnavailableError(
    `node-pty is not installed. Run \`bun add @homebridge/node-pty-prebuilt-multiarch\` (or \`node-pty\`) and restart \`bun dev\`. ${lastErr instanceof Error ? lastErr.message : ""}`.trim(),
  );
}

/**
 * Spawn tmux attached to the given session and pipe its output to a callback.
 * Resolves with the live IPty handle plus a cleanup function. The caller is
 * responsible for calling cleanup when the WebSocket closes.
 */
export async function attachTmuxPty(
  opts: TmuxPtyOptions,
): Promise<{ pty: IPty; cleanup: () => void }> {
  const pty = await loadPty();
  const tmuxBin = opts.tmuxBin ?? "tmux";
  const term = pty.spawn(
    tmuxBin,
    ["attach", "-t", opts.name],
    {
      name: opts.term ?? "xterm-256color",
      cols: opts.cols,
      rows: opts.rows,
      cwd: opts.cwd ?? process.env.HOME ?? "/tmp",
      env: SAFE_ENV,
      // `handleFlowControl` lets the client drive Ctrl-S/Ctrl-Q cleanly.
      handleFlowControl: false,
    },
  );

  // Cap chunks so a runaway producer can't OOM the event loop.
  term.onData((chunk) => {
    if (chunk.length > MAX_CHUNK_BYTES) {
      for (let i = 0; i < chunk.length; i += MAX_CHUNK_BYTES) {
        opts.onData(chunk.slice(i, i + MAX_CHUNK_BYTES));
      }
    } else {
      opts.onData(chunk);
    }
  });
  term.onExit((info) => opts.onExit(info));

  return {
    pty: term,
    cleanup: () => {
      try {
        term.kill();
      } catch {
        /* already gone */
      }
    },
  };
}

/**
 * Route a single WebSocket message from the browser to the PTY. Browser
 * protocol: control JSON is sent as text; keystrokes are text; binary frames
 * are treated as utf8 keystrokes for compatibility with `xterm.js`'s
 * `binaryType = "arraybuffer"` mode.
 */
export function handleBrowserMessage(pty: IPty, raw: unknown): void {
  if (typeof raw === "string") {
    const trimmed = raw.trimStart();
    if (trimmed.startsWith("{")) {
      const handled = tryHandleResizeMessage(pty, trimmed);
      if (handled) return;
    }
    pty.write(raw);
    return; // NOSONAR: early return pattern for type narrowing
  }
  if (raw instanceof ArrayBuffer) {
    pty.write(Buffer.from(raw).toString("utf8"));
    return;
  }
}

function tryHandleResizeMessage(pty: IPty, trimmed: string): boolean {
  try {
    const msg = JSON.parse(trimmed);
    if (msg?.type === "resize") {
      const cols = Number(msg.cols);
      const rows = Number(msg.rows);
      if (isValidResize(cols, rows)) {
        pty.resize(cols, rows);
        return true;
      }
    }
  } catch {
    /* not JSON — fall through */
  }
  return false;
}

function isValidResize(cols: number, rows: number): boolean {
  return (
    Number.isInteger(cols) && cols >= 10 && cols <= 512 &&
    Number.isInteger(rows) && rows >= 5 && rows <= 256
  );
}

/**
 * Bind a freshly-upgraded WebSocket to a freshly-spawned tmux PTY.
 * Returns a cleanup function the caller can invoke on socket close / error.
 */
export function bindSocketToPty(ws: WsWebSocket, pty: IPty): () => void {
  const onMessage = (data: unknown) => {
    try {
      handleBrowserMessage(pty, data);
    } catch {
      /* ignore bad input */
    }
  };
  ws.on("message", onMessage);

  return () => {
    ws.off("message", onMessage);
  };
}
