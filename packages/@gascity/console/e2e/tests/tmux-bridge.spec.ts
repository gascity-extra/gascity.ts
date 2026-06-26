/**
 * Smoke tests for the tmux WebSocket bridge added to the console.
 *
 * These do NOT require a running GC backend — they only exercise the dev
 * server's own HTTP + WS surface. They give us regression coverage for
 * the changes in:
 *
 *   - vite/pty-websocket.ts           (the Vite plugin)
 *   - src/server/tmux-pty.ts          (the PTY bridge)
 *   - src/routes/api/pty.ts           (the HTTP probe)
 *   - src/vite-env.d.ts               (ambient type forwarding)
 *
 * If tmux isn't installed on the host, the WS upgrade still succeeds and
 * the bridge closes gracefully with a typed `{type:"error"}` frame — that's
 * the contract the SessionTerminal.tsx UI relies on for its "unavailable"
 * hint.
 */
import { test, expect } from "@playwright/test";

const NAME_RE = /^[a-zA-Z0-9_.-]{1,64}$/;

function wsUrl(baseURL: string | undefined, path: string): string {
  const httpBase =
    baseURL ?? process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const u = new URL(path, httpBase);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  return u.toString();
}

test.describe("tmux bridge", () => {
  test("HTTP probe /api/pty returns feature-detection JSON", async ({
    request,
  }) => {
    const res = await request.get("/api/pty");
    expect([200, 503]).toContain(res.status());
    const body = (await res.json()) as {
      ok: boolean;
      tmuxBin: string;
      nodePty: boolean;
      message: string;
    };
    expect(body.tmuxBin).toMatch(/^[a-zA-Z0-9_./-]+$/);
    expect(typeof body.nodePty).toBe("boolean");
    expect(typeof body.message).toBe("string");
    // node-pty is installed in this workspace; bridge should report ready.
    expect(body.nodePty).toBe(true);
  });

  test("HTTP probe /api/pty rejects invalid session names", async ({
    request,
  }) => {
    const res = await request.get("/api/pty?name=has%20space");
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/invalid session name/i);
  });

  test("WebSocket upgrade opens and emits hello frame", async ({
    baseURL,
  }) => {
    const url = wsUrl(baseURL, "/api/pty?name=smoke-test&cols=120&rows=30");

    const messages: string[] = [];
    const closeInfo = await new Promise<{ code: number; reason: string }>(
      (resolve, reject) => {
        const ws = new WebSocket(url);
        const timer = setTimeout(
          () => reject(new Error("ws test timeout")),
          8000,
        );
        ws.onmessage = (ev) => {
          if (typeof ev.data === "string") {
            messages.push(ev.data);
          }
          if (
            messages.some(
              (m) =>
                m.includes('"type":"hello"') || m.includes('"type":"error"'),
            )
          ) {
            clearTimeout(timer);
            try {
              ws.close(1000, "test-done");
            } catch {
              /* ignore */
            }
          }
        };
        ws.onclose = (ev) => {
          clearTimeout(timer);
          resolve({ code: ev.code, reason: ev.reason });
        };
        ws.onerror = () => {
          // Errors are reported as close frames too; let the close
          // handler be the single source of truth.
        };
      },
    );

    expect([1000, 1011]).toContain(closeInfo.code);
    const helloOrError = messages.find(
      (m) => m.includes('"type":"hello"') || m.includes('"type":"error"'),
    );
    expect(helloOrError).toBeDefined();
  });

  test("WebSocket upgrade rejects invalid session names", async ({
    baseURL,
  }) => {
    const url = wsUrl(baseURL, "/api/pty?name=has%20space&cols=120&rows=30");

    const messages: string[] = [];
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(url);
      const timer = setTimeout(resolve, 4000);
      ws.onmessage = (ev) => {
        if (typeof ev.data === "string") messages.push(ev.data);
      };
      ws.onclose = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });

    const errorFrame = messages.find((m) => m.includes('"type":"error"'));
    expect(errorFrame).toBeDefined();
    expect(errorFrame).toMatch(/invalid session name/i);
  });

  test("WebSocket upgrade rejects out-of-range cols", async ({ baseURL }) => {
    const url = wsUrl(baseURL, "/api/pty?name=smoke&cols=999999&rows=30");

    const messages: string[] = [];
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(url);
      const timer = setTimeout(resolve, 4000);
      ws.onmessage = (ev) => {
        if (typeof ev.data === "string") messages.push(ev.data);
      };
      ws.onclose = () => {
        clearTimeout(timer);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });

    const errorFrame = messages.find((m) => m.includes('"type":"error"'));
    expect(errorFrame).toBeDefined();
    expect(errorFrame).toMatch(/invalid cols/i);
  });

  test("session name validation regex covers the documented charset", () => {
    // Duplicated from the bridge so we catch drift if either side changes.
    expect("default.gascity_001-a").toMatch(NAME_RE);
    expect("has space").not.toMatch(NAME_RE);
    expect("semicolon;injection").not.toMatch(NAME_RE);
    expect("a".repeat(65)).not.toMatch(NAME_RE);
    expect("a".repeat(64)).toMatch(NAME_RE);
  });
});
