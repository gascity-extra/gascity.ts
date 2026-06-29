import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import clsx from "clsx";

import { AppShell } from "@/components/AppShell";
import {
  gcDoltState,
  gcListCities,
  gcRepairPortMirror,
  gcRigEndpoints,
} from "@/server/gc.functions";

export const Route = createFileRoute("/endpoints")({
  head: () => ({ meta: [{ title: "Endpoints — gc console" }] }),
  component: EndpointsPage,
});

function EndpointsPage() {
  const listCities = useServerFn(gcListCities);
  const dolt = useServerFn(gcDoltState);
  const rigs = useServerFn(gcRigEndpoints);
  const repair = useServerFn(gcRepairPortMirror);
  const qc = useQueryClient();

  const { data: cities } = useQuery({
    queryKey: ["gc", "cities"],
    queryFn: () => listCities(),
  });
  const [cityName, setCityName] = useState<string>("");
  const city = (cities ?? []).find((c) => c.name === cityName) ?? cities?.[0];

  const { data: state } = useQuery({
    queryKey: ["gc", "dolt", city?.path],
    queryFn: () => dolt({ data: { cityPath: city!.path }}),
    enabled: !!city?.path,
    refetchInterval: 5000,
  });

  const { data: rigsResult } = useQuery({
    queryKey: ["gc", "rigs", city?.path, state?.port],
    queryFn: () =>
      rigs({ data: {
        cityPath: city!.path,
        managedPort: state?.port ?? 0,
      }}),
    enabled: !!city?.path && !!state?.port,
    refetchInterval: 5000,
  });
  const endpoints = rigsResult?.endpoints ?? [];

  const repairMut = useMutation({
    mutationFn: (vars: { rigPath: string; port: number }) =>
      repair({ data: vars }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["gc", "rigs"] }),
  });

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h1 className="font-mono text-sm">managed endpoints</h1>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-muted-foreground">city</span>
            <select
              value={cityName || city?.name || ""}
              onChange={(e) => setCityName(e.target.value)}
              className="bg-transparent text-foreground outline-none"
            >
              {(cities ?? []).map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-b border-border px-6 py-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            city-managed dolt
          </div>
          {state ? (
            <div className="mt-1 flex items-baseline gap-4 font-mono text-sm">
              <span className="text-foreground">
                127.0.0.1:<b>{state.port}</b>
              </span>
              {state.pid && (
                <span className="text-muted-foreground">pid {state.pid}</span>
              )}
              {state.databases && state.databases.length > 0 && (
                <span className="text-muted-foreground">
                  {state.databases.length} db
                </span>
              )}
            </div>
          ) : (
            <div className="mt-1 font-mono text-xs text-destructive">
              dolt-state.json not found in {city?.path ?? "(no city)"}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-border px-6 py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            rigs · port-mirror health
          </div>
          {!endpoints?.length && (
            <div className="px-6 py-6 font-mono text-xs text-muted-foreground">
              no rigs found.
            </div>
          )}
          <ul>
            {(endpoints ?? []).map((r) => (
              <li
                key={r.rig}
                className="grid grid-cols-[1fr_100px_140px_120px] items-center gap-3 border-b border-border px-6 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm text-foreground">
                    {r.rig}
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {r.path}
                  </div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  mirror: {r.mirror_port ?? "—"}
                </span>
                <span
                  className={clsx(
                    "flex items-center gap-1.5 font-mono text-xs",
                    r.matches_managed
                      ? "text-foreground"
                      : "text-destructive",
                  )}
                >
                  <span
                    className={clsx(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      r.matches_managed
                        ? "live-dot"
                        : "bg-destructive",
                    )}
                  />
                  {r.matches_managed ? "in sync" : "drift"}
                </span>
                <div className="flex justify-end">
                  {!r.matches_managed && state?.port && (
                    <button
                      onClick={() =>
                        repairMut.mutate({
                          rigPath: r.path,
                          port: state.port,
                        })
                      }
                      className="rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:bg-muted"
                    >
                      repair → {state.port}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="px-6 py-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
            See{" "}
            <a
              href="https://docs.gascity.com/runbooks/managed-city-endpoints"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              managed-city-endpoints runbook
            </a>
            . "Drift" means a rig's <code>.beads/dolt-server.port</code> mirror
            doesn't match the city-managed Dolt port — the #1 cause of{" "}
            <code>rigStores=0</code> in supervisor.log.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
