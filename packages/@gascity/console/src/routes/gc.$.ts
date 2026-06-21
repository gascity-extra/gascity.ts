/**
 * Production passthrough to the gc supervisor API.
 *
 * Mirrors the Vite dev proxy in vite.config.ts so the browser can call
 * `/gc/<path>` on the same origin in both dev and the published Worker.
 * The Worker hits whatever `GC_API_BASE_URL` resolves to from its runtime
 * env (defaults to `http://127.0.0.1:8372`, only reachable when the
 * Worker shares a network with the supervisor — useful for self-hosted
 * deploys; in the hosted Worker you'd set GC_API_BASE_URL to a public URL).
 */

import { createFileRoute } from "@tanstack/react-router";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

function baseUrl(): string {
  return (
    process.env.GC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8372"
  );
}

function authHeaders(): Record<string, string> {
  const token = process.env.GC_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function proxy(request: Request, splat: string | undefined) {
  const incoming = new URL(request.url);
  const target = baseUrl() + "/" + (splat ?? "") + incoming.search;

  // Strip hop-by-hop and host headers before forwarding.
  const fwd = new Headers(request.headers);
  fwd.delete("host");
  fwd.delete("connection");
  fwd.delete("content-length");
  for (const [k, v] of Object.entries(authHeaders())) fwd.set(k, v);

  const init: RequestInit = {
    method: request.method,
    headers: fwd,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
  };

  try {
    const res = await fetch(target, init);
    // Pass through status/headers/body as-is.
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "gc upstream unreachable",
        target,
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/gc/$")({
  server: {
    handlers: Object.fromEntries(
      METHODS.map((m) => [
        m,
        async ({ request, params }: { request: Request; params: { _splat?: string } }) =>
          proxy(request, params._splat),
      ]),
    ) as Record<(typeof METHODS)[number], (ctx: { request: Request; params: { _splat?: string } }) => Promise<Response>>,
  },
});
