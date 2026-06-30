import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy /packs URL. The console now exposes a Marketplace UI at
 * /marketplace that consumes the upstream registry directly, so the
 * old per-pack list has been retired. We redirect rather than 404 so
 * existing bookmarks, command-palette entries, and any e2e tests
 * that still target /packs keep working.
 */
export const Route = createFileRoute("/packs")({
  beforeLoad: () => {
    throw redirect({ to: "/marketplace" });
  },
});
