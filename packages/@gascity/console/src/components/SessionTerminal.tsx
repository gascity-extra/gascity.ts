import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { gcSessionPeek } from "@/lib/gc.functions";

export function SessionTerminal({ name }: Readonly<{ name: string }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<unknown>(null);
  const [status, setStatus] = useState<
    "connecting" | "open" | "closed" | "error" | "unavailable"
  >("connecting");
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const [showPeek, setShowPeek] = useState(false);

  useEffect(() => {
    let disposed = false;
    let fitAddon: import("@xterm/addon-fit").FitAddon | null = null;

    async function boot() {
      // dynamic import — xterm is browser-only
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      await import("@xterm/xterm/css/xterm.css");
      if (disposed || !containerRef.current) return;

      const term = new Terminal({
        fontFamily:
          "'Geist Mono Variable', ui-monospace, SFMono-Regular, monospace",
        fontSize: 13,
        lineHeight: 1.25,
        cursorBlink: true,
        theme: {
          background: "#fdfdfd",
          foreground: "#1a1a1a",
          cursor: "#1a1a1a",
          selectionBackground: "#f5c97a",
        },
        allowProposedApi: true,
      });
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();
      termRef.current = term;

      // ---- Feature-detect the bridge ----
      // The Vite plugin answers GET /api/pty with a small JSON probe so we
      // can degrade gracefully when tmux / node-pty is missing on the host.
      let probe: {
        ok?: boolean;
        nodePty?: boolean;
        message?: string;
        error?: string;
      } | null = null;
      try {
        const res = await fetch("/api/pty", { headers: { accept: "application/json" } });
        if (res.ok || res.status === 503) {
          probe = (await res.json()) as { ok?: boolean; nodePty?: boolean; message?: string; error?: string };
        }
      } catch {
        /* network failure — fall through to attempt the upgrade */
      }
      if (probe && !probe.ok) {
        setUnavailableReason(probe.message ?? probe.error ?? "bridge unavailable");
        setStatus("unavailable");
        term.writeln(
          "\r\n\x1b[33mterminal bridge unavailable\x1b[0m — using peek only",
        );
        return;
      }

      // ---- Open the upgrade ----
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${proto}//${location.host}/api/pty?name=${encodeURIComponent(
        name,
      )}&cols=${term.cols}&rows=${term.rows}`;
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("open");
        // Bridge already sized us; resend in case it changed since.
        ws.send(
          JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }),
        );
      };
      ws.onmessage = (ev) => {
        if (typeof ev.data === "string") {
          // control message or text
          try {
            const m = JSON.parse(ev.data);
            if (m?.type === "error") {
              setStatus("unavailable");
              setUnavailableReason(m.message);
              term.writeln("\r\n\x1b[31m" + m.message + "\x1b[0m");
              return;
            }
            if (m?.type === "hello") {
              // Bridge handshake — could be used to surface pid / session
              // metadata, but for now we just acknowledge.
              return;
            }
          } catch {
            term.write(ev.data);
            return;
          }
          term.write(ev.data);
        } else {
          term.write(new Uint8Array(ev.data as ArrayBuffer));
        }
      };
      ws.onclose = () => setStatus((s) => (s === "unavailable" ? s : "closed"));
      ws.onerror = () => setStatus("error");

      term.onData((d) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(d);
      });

      const onResize = () => {
        fitAddon?.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "resize",
              cols: term.cols,
              rows: term.rows,
            }),
          );
        }
      };
      window.addEventListener("resize", onResize);
      (term as unknown as { __cleanup?: () => void }).__cleanup = () => {
        window.removeEventListener("resize", onResize);
      };
    }

    boot().catch(() => setStatus("error"));

    return () => {
      disposed = true;
      try {
        wsRef.current?.close();
      } catch {
        /* ignore */
      }
      try {
        const t = termRef.current as
          | { dispose: () => void; __cleanup?: () => void }
          | null;
        t?.__cleanup?.();
        t?.dispose();
      } catch {
        /* ignore */
      }
      try {
        fitAddon?.dispose();
      } catch {
        /* ignore */
      }
    };
  }, [name]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            ← sessions
          </Link>
          <span className="font-mono text-sm text-foreground">{name}</span>
          <StatusPill status={status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPeek((v) => !v)}
            className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            peek
          </button>
          <span className="font-mono text-[11px] text-muted-foreground">
            ctrl-b d to detach · tmux stays alive
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-[oklch(0.99_0_0)] dark:bg-[oklch(0.16_0_0)]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {status === "unavailable" && (
        <UnavailableHint reason={unavailableReason} />
      )}
      {showPeek && <PeekDrawer name={name} onClose={() => setShowPeek(false)} />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color = (() => {
    if (status === "open") return "live-dot"
    if (status === "error" || status === "unavailable") return "bg-destructive"
    return "bg-muted-foreground"
  })();
  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />
      {status}
    </span>
  );
}

function UnavailableHint({ reason }: { readonly reason: string | null }) {
  return (
    <div className="border-t border-border bg-muted/40 px-6 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
      <div className="text-foreground">Terminal bridge unavailable.</div>
      {reason && <div className="mt-1">{reason}</div>}
      <div className="mt-2">
        The pty route needs <code>@homebridge/node-pty-prebuilt-multiarch</code>{" "}
        installed and <code>tmux</code> on PATH. Install locally with{" "}
        <code>bun add @homebridge/node-pty-prebuilt-multiarch ws</code>, then
        restart the dev server. Until then, use <em>peek</em> for a read-only
        snapshot and <em>nudge</em> to send a line.
      </div>
    </div>
  );
}

function PeekDrawer({ name, onClose }: { name: string; onClose: () => void }) {
  const peek = useServerFn(gcSessionPeek);
  const { data, isLoading } = useQuery({
    queryKey: ["gc", "peek", name],
    queryFn: () => peek({ data: { name, lines: 200 }}),
    refetchInterval: 1500,
  });
  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          peek · last 200 lines · refresh 1.5s
        </span>
        <button
          onClick={onClose}
          className="font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          close
        </button>
      </div>
      <pre className="max-h-64 overflow-auto px-6 py-3 font-mono text-[11px] leading-relaxed text-foreground">
        {isLoading ? "…" : data?.output ?? ""}
      </pre>
    </div>
  );
}
