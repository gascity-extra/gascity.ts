/**
 * WebSocket bridge: browser xterm.js  <->  local `tmux attach -t <name>`.
 *
 * Requires `node-pty` and `ws` installed locally, and `tmux` on PATH.
 * Lazy-imported so the build doesn't fail when those native deps are absent
 * (e.g. in the Lovable preview sandbox). When unavailable, the route returns
 * a clear JSON error and the client UI shows a hint to install them.
 *
 * In TanStack Start dev mode, this runs on the Node-based Vite SSR server,
 * which can spawn subprocesses. Do NOT deploy to a Worker runtime — this is
 * local-only by design.
 *
 * SECURITY: This route is disabled in production and requires development mode.
 * Input validation is applied to prevent command injection.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/pty")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Security: Disable in production environments
        if (process.env.NODE_ENV === "production") {
          return new Response(
            JSON.stringify({ error: "PTY endpoint is disabled in production" }),
            { status: 403, headers: { "content-type": "application/json" } },
          );
        }

        const url = new URL(request.url);
        const name = url.searchParams.get("name");
        if (!name) {
          return new Response(
            JSON.stringify({ error: "missing ?name=<session>" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        // Security: Validate name parameter to prevent command injection
        // Allow only alphanumeric, underscore, hyphen, and dot characters
        const nameValidation = /^[a-zA-Z0-9_.-]{1,64}$/;
        if (!nameValidation.test(name)) {
          return new Response(
            JSON.stringify({ error: "invalid session name (allowed: a-zA-Z0-9_.-, max 64 chars)" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        // Try to upgrade. In Node (dev), TanStack Start exposes the raw socket
        // via Symbol-keyed properties on the request; we use the standard
        // `ws` package if present.
        try {
          // Untyped dynamic imports — these native deps are only installed
          // locally; absence is handled gracefully.
          const ptyMod = await import(
            /* @vite-ignore */ "node-pty" as string
          ).catch(() => null) as
            | {
                spawn: (
                  cmd: string,
                  args: string[],
                  opts: Record<string, unknown>,
                ) => {
                  onData: (cb: (chunk: string) => void) => void;
                  onExit: (cb: (e: { exitCode: number }) => void) => void;
                  write: (s: string) => void;
                  resize: (cols: number, rows: number) => void;
                  kill: () => void;
                };
              }
            | null;
          const wsMod = await import(
            /* @vite-ignore */ "ws" as string
          ).catch(() => null);
          if (!ptyMod || !wsMod) {
            return new Response(
              JSON.stringify({
                error:
                  "node-pty/ws not installed. Run `bun add node-pty ws` locally and restart `bun dev`.",
              }),
              {
                status: 501,
                headers: { "content-type": "application/json" },
              },
            );
          }

          const upgrade = (request as unknown as {
            [k: string]: ((sub?: string) => Promise<WebSocket>) | undefined;
          })["upgrade"];
          if (typeof upgrade !== "function") {
            return new Response(
              JSON.stringify({
                error:
                  "WebSocket upgrade unsupported in this runtime. Local dev only.",
              }),
              {
                status: 501,
                headers: { "content-type": "application/json" },
              },
            );
          }
          const ws = await upgrade();
          const cols = Number(url.searchParams.get("cols") || 120);
          const rows = Number(url.searchParams.get("rows") || 30);

          // Security: Validate cols and rows are finite integers within sane bounds
          if (!Number.isInteger(cols) || cols < 10 || cols > 512) {
            return new Response(
              JSON.stringify({ error: "invalid cols (must be integer between 10-512)" }),
              { status: 400, headers: { "content-type": "application/json" } },
            );
          }
          if (!Number.isInteger(rows) || rows < 5 || rows > 256) {
            return new Response(
              JSON.stringify({ error: "invalid rows (must be integer between 5-256)" }),
              { status: 400, headers: { "content-type": "application/json" } },
            );
          }

          const tmuxBin = process.env.TMUX_BIN || "tmux";
          const term = ptyMod.spawn(tmuxBin, ["attach", "-t", name], {
            name: "xterm-256color",
            cols,
            rows,
            cwd: process.env.HOME,
            env: process.env as Record<string, string>,
          });

          term.onData((chunk: string) => {
            try {
              ws.send(chunk);
            } catch {
              /* socket closed */
            }
          });
          term.onExit(({ exitCode }: { exitCode: number }) => {
            try {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: `tmux attach exited (${exitCode}). The session may not exist or tmux is unavailable.`,
                }),
              );
              ws.close();
            } catch {
              /* ignore */
            }
          });

          ws.addEventListener("message", (ev) => {
            const data = (ev as MessageEvent).data;
            if (typeof data === "string") {
              try {
                const m = JSON.parse(data);
                if (m?.type === "resize") {
                  term.resize(Number(m.cols) || cols, Number(m.rows) || rows);
                  return;
                }
              } catch {
                /* fall through */
              }
              term.write(data);
            } else if (data instanceof ArrayBuffer) {
              term.write(Buffer.from(data).toString("utf8"));
            }
          });
          ws.addEventListener("close", () => {
            try {
              term.kill();
            } catch {
              /* ignore */
            }
          });

          // The Response is meaningless for an upgraded socket but TanStack
          // requires a return value.
          return new Response(null, { status: 101 });
        } catch (err) {
          return new Response(
            JSON.stringify({
              error: err instanceof Error ? err.message : String(err),
            }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
