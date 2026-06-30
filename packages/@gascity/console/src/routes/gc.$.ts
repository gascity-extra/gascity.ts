/**
 * Catch-all passthrough to the gc supervisor API.
 *
 * In dev, Vite proxies /gc/* to GC_API_BASE_URL (see vite.config.ts). In
 * production, the deployed worker proxies via this server route handler.
 *
 * Authentication:
 * - Clients can provide their own Bearer token via Authorization header.
 * - If no token is provided, falls back to server-side GC_API_TOKEN.
 */

import { createFileRoute } from "@tanstack/react-router";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

function baseUrl(): string {
  return (
    (typeof process !== "undefined" && process.env?.GC_API_BASE_URL?.replace(/\/$/, "")) ||
    "http://127.0.0.1:8372"
  );
}

function authHeaders(incomingToken?: string): Record<string, string> {
  let token = incomingToken;
  if (!token && typeof process !== "undefined") {
    token = process.env?.GC_API_TOKEN;
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function proxy(request: Request, splat: string | undefined) {
  const incoming = new URL(request.url);
  const target = baseUrl() + "/" + (splat ?? "") + incoming.search;

  const incomingAuth = request.headers.get("authorization");
  const incomingToken = incomingAuth?.replace(/^Bearer\s+/i, "");

  const fwd = new Headers(request.headers);
  fwd.delete("host");
  fwd.delete("connection");
  fwd.delete("content-length");
  fwd.delete("authorization");
  for (const [k, v] of Object.entries(authHeaders(incomingToken))) fwd.set(k, v);

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