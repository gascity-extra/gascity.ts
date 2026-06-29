/**
 * Vite plugin: tmux WebSocket bridge.
 *
 * Attaches a `ws.WebSocketServer` (noServer mode) to the dev HTTP server and
 * upgrades connections on `/api/pty` to a tmux PTY. This keeps the terminal
 * bridge on the same port and process as Vite — no `concurrently` script,
 * no extra 5175 listener.
 *
 * The route handler at `src/routes/api/pty.ts` is reduced to a plain HTTP
 * health probe so the client can feature-detect (probe=1) without attempting
 * a WebSocket upgrade.
 *
 * SECURITY:
 *   - Production is rejected (NODE_ENV=production) so this never ships.
 *   - Session name is matched against a strict allow-list.
 *   - `TMUX_BIN` env override is matched against a strict allow-list.
 *   - The PTY is spawned with a sanitized environment, not process.env.
 */
import type { Plugin, ViteDevServer } from "vite";
import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";

import {
  attachTmuxPty,
  bindSocketToPty,
  loadPty,
  TmuxPtyUnavailableError,
  type IPty,
} from "../src/server/tmux-pty";

const PTY_PATH = "/api/pty";
const PROBE_PATH = "/api/pty/probe";

const NAME_RE = /^[a-zA-Z0-9_.-]{1,64}$/;
const TMUX_BIN_RE = /^[a-zA-Z0-9_./-]+$/;

function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}

function sendError(ws: WsWebSocket, message: string) {
  try {
    ws.send(JSON.stringify({ type: "error", message }));
  } catch {
    /* socket already gone */
  }
  try {
    ws.close(1011, message.slice(0, 120));
  } catch {
    /* ignore */
  }
}

interface ActiveSocket {
  socket: WsWebSocket;
  cleanupPty: () => void;
  detachSocket: () => void;
}

export function tmuxWebSocketPlugin(): Plugin {
  const active = new Set<ActiveSocket>();

  return {
    name: "gascity:tmux-websocket",
    apply: "serve",

    async configureServer(server: ViteDevServer) {
      // Don't run in production preview — preview is for static assets, and
      // the underlying tmux binary may not even be present.
      if (process.env.NODE_ENV === "production") {
        return;
      }

      // ---- HTTP probe ----
      // GET /api/pty/probe  ->  { ok, tmux, nodePty, error? }
      // Used by the client to feature-detect without opening a WebSocket.
      server.middlewares.use(PROBE_PATH, async (_req, res) => {
        const probe: {
          ok: boolean;
          tmux: boolean;
          nodePty: boolean;
          tmuxBin: string;
          error?: string;
        } = {
          ok: false,
          tmux: false,
          nodePty: false,
          tmuxBin: process.env.TMUX_BIN ?? "tmux",
        };
        try {
          if (!TMUX_BIN_RE.test(probe.tmuxBin)) {
            throw new Error(`invalid TMUX_BIN (${probe.tmuxBin})`);
          }
          await loadPty();
          probe.nodePty = true;
          probe.ok = true;
        } catch (err) {
          probe.error = err instanceof Error ? err.message : String(err);
        }
        sendJson(res, probe.ok ? 200 : 503, probe);
      });

      // ---- WebSocket upgrade ----
      if (!server.httpServer) {
        // configureServer can fire before httpServer is created; defer.
        return;
      }

      const wss = new WebSocketServer({ noServer: true });
      const httpServer = server.httpServer;

      httpServer.on("upgrade", (req, socket, head) => {
        // URL parse is cheap; we only upgrade our path.
        const url = req.url ?? "";
        if (!url.startsWith(PTY_PATH)) return;
        // Disallow ?probe= upgrades; that's an HTTP probe path.
        if (url.startsWith(PROBE_PATH)) {
          socket.destroy();
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws: WsWebSocket) => {
          handleConnection(ws, req.url ?? "", active, () => {
            // called on socket close to drop the entry
          });
        });
      });

      // Tear down on server close (Ctrl-C, restart).
      const closeAll = () => {
        for (const entry of active) {
          try {
            entry.cleanupPty();
          } catch {
            /* ignore */
          }
          try {
            entry.socket.close(1001, "server shutting down");
          } catch {
            /* ignore */
          }
        }
        active.clear();
        wss.close();
      };
      // `httpServer` and `server.httpServer` are typically the same
      // underlying node:http.Server; registering the cleanup on both
      // would run it twice on shutdown. Use the explicit `httpServer`
      // argument if provided, otherwise fall back to Vite's `server.httpServer`.
      const target = httpServer ?? server.httpServer;
      if (target) target.on("close", closeAll);
    },
  };
}

async function handleConnection(
  ws: WsWebSocket,
  rawUrl: string,
  active: Set<ActiveSocket>,
  _onClose: () => void,
) {
  // Parse query string. The browser sends ?name=&cols=&rows=.
  const queryIndex = rawUrl.indexOf("?");
  const query = queryIndex >= 0 ? new URLSearchParams(rawUrl.slice(queryIndex + 1)) : new URLSearchParams();
  const name = query.get("name") ?? "";
  const cols = Number(query.get("cols") ?? 120);
  const rows = Number(query.get("rows") ?? 30);
  const tmuxBin = process.env.TMUX_BIN ?? "tmux";

  if (!NAME_RE.test(name)) {
    sendError(ws, "invalid session name (allowed: a-zA-Z0-9_.-, max 64 chars)");
    return;
  }
  if (!TMUX_BIN_RE.test(tmuxBin)) {
    sendError(ws, `invalid TMUX_BIN env (${tmuxBin})`);
    return;
  }
  if (!Number.isInteger(cols) || cols < 10 || cols > 512) {
    sendError(ws, "invalid cols (must be integer 10..512)");
    return;
  }
  if (!Number.isInteger(rows) || rows < 5 || rows > 256) {
    sendError(ws, "invalid rows (must be integer 5..256)");
    return;
  }

  let pty: IPty | null = null;
  let detachSocket: (() => void) | null = null;
  let cleanupPty: (() => void) | null = null;

  const entry: ActiveSocket = {
    socket: ws,
    cleanupPty: () => {
      try {
        cleanupPty?.();
      } catch {
        /* ignore */
      }
    },
    detachSocket: () => detachSocket?.(),
  };
  active.add(entry);

  const removeEntry = () => active.delete(entry);

  try {
    const handle = await attachTmuxPty({
      name,
      cols,
      rows,
      tmuxBin,
      onData: (chunk) => {
        if (ws.readyState !== ws.OPEN) return;
        try {
          ws.send(chunk);
        } catch {
          /* socket closing */
        }
      },
      onExit: ({ exitCode }) => {
        sendError(
          ws,
          `tmux attach exited (${exitCode}). The session may not exist or tmux is unavailable.`,
        );
        removeEntry();
      },
    });
    pty = handle.pty;
    cleanupPty = handle.cleanup;
    detachSocket = bindSocketToPty(ws, pty);
  } catch (err) {
    const msg =
      err instanceof TmuxPtyUnavailableError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    sendError(ws, msg);
    removeEntry();
    return;
  }

  // Hello frame — gives the client a chance to resize before any data arrives.
  try {
    ws.send(
      JSON.stringify({
        type: "hello",
        name,
        cols,
        rows,
        pid: pty?.pid ?? 0,
      }),
    );
  } catch {
    /* ignore */
  }

  ws.on("close", () => {
    try {
      cleanupPty?.();
    } catch {
      /* ignore */
    }
    try {
      detachSocket?.();
    } catch {
      /* ignore */
    }
    removeEntry();
  });
  ws.on("error", () => {
    try {
      cleanupPty?.();
    } catch {
      /* ignore */
    }
    removeEntry();
  });
}
