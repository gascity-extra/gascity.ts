import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import clsx from "clsx";

import { AppShell } from "@/components/AppShell";
import {
  gcCityInitWithPacks,
  gcCityStart,
  gcCityStop,
  gcListCities,
  gcListPacks,
} from "@/lib/gc.functions";

export const Route = createFileRoute("/cities")({
  head: () => ({ meta: [{ title: "Cities — gc console" }] }),
  component: CitiesPage,
});

function CitiesPage() {
  const list = useServerFn(gcListCities);
  const start = useServerFn(gcCityStart);
  const stop = useServerFn(gcCityStop);
  const qc = useQueryClient();
  const [output, setOutput] = useState<string>("");
  const [initOpen, setInitOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["gc", "cities"],
    queryFn: () => list(),
    refetchInterval: 5000,
  });

  const startMut = useMutation({
    mutationFn: () => start(),
    onSuccess: (r) => {
      setOutput(r.output);
      qc.invalidateQueries({ queryKey: ["gc", "cities"] });
    },
  });
  const stopMut = useMutation({
    mutationFn: () => stop(),
    onSuccess: (r) => {
      setOutput(r.output);
      qc.invalidateQueries({ queryKey: ["gc", "cities"] });
    },
  });

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h1 className="font-mono text-sm">cities</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setInitOpen(true)}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
            >
              + new city
            </button>
            <button
              onClick={() => startMut.mutate()}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
            >
              gc start
            </button>
            <button
              onClick={() => stopMut.mutate()}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              gc stop
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="px-6 py-4 font-mono text-xs text-muted-foreground">
              loading…
            </div>
          )}
          {!isLoading && !data?.length && (
            <div className="px-6 py-8 font-mono text-xs text-muted-foreground">
              no cities. click <span className="text-foreground">+ new city</span> to create one with packs.
            </div>
          )}
          <ul>
            {(data ?? []).map((c) => (
              <li
                key={c.name}
                className="grid grid-cols-[1fr_80px_140px] items-center gap-3 border-b border-border px-6 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm text-foreground">
                    {c.name}
                    {c.active && (
                      <span className="ml-2 inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" />
                        active
                      </span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {c.path}
                  </div>
                </div>
                <span
                  className={clsx(
                    "font-mono text-[11px]",
                    c.status === "running"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {c.status ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {output && (
          <div className="border-t border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-2">
              <span className="font-mono text-xs text-muted-foreground">
                output
              </span>
              <button
                onClick={() => setOutput("")}
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                clear
              </button>
            </div>
            <pre className="max-h-48 overflow-auto px-6 py-3 font-mono text-[11px] leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>

      {initOpen && (
        <InitCityDialog
          onClose={() => setInitOpen(false)}
          onDone={(out) => {
            setOutput(out);
            setInitOpen(false);
            qc.invalidateQueries({ queryKey: ["gc", "cities"] });
          }}
        />
      )}
    </AppShell>
  );
}

function InitCityDialog({
  onClose,
  onDone,
}: Readonly<{
  onClose: () => void;
  onDone: (output: string) => void;
}>) {
  const listPacks = useServerFn(gcListPacks);
  const initFn = useServerFn(gcCityInitWithPacks);

  const { data: packs } = useQuery({
    queryKey: ["gc", "packs"],
    queryFn: () => listPacks(),
  });

  const [path, setPath] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["gascity"]));

  const initMut = useMutation({
    mutationFn: () => {
      const chosen = (packs ?? []).filter((p) => selected.has(p.name));
      return initFn({
        data: {
          path,
          packs: chosen.map((p) => ({ name: p.name, source: p.source })),
        },
      });
    },
    onSuccess: (r) => {
      // Surface the server-fn's `error` field alongside `output` so the
      // action console can distinguish "init failed because X" from
      // the bare `gc init threw unexpectedly` summary. The server fn
      // also runs `POST /v0/city` (init + register + start) — see
      // `gcCityInitWithPacks` for the wiring.
      const detail = r.error ? `\n  (${r.error})` : ''
      onDone(`${r.output}${detail}`)
    },
  })

  function toggle(name: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 pt-[8vh]"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Close dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-card"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-mono text-xs text-foreground">new city</span>
          <Link
            to="/marketplace"
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            browse marketplace →
          </Link>
        </div>
        <div className="px-4 py-3">
          <label htmlFor="city-path" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            city path
          </label>
          <input
            id="city-path"
            autoFocus
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="~/my-city"
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:border-foreground/40"
          />
        </div>
        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              packs ({selected.size} selected)
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              clear
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {(packs ?? []).map((p) => {
              const on = selected.has(p.name);
              return (
                <li key={p.name}>
                  <button
                    onClick={() => toggle(p.name)}
                    className={clsx(
                      "flex w-full items-start gap-2 border-t border-border px-4 py-2 text-left hover:bg-muted",
                      on && "bg-muted",
                    )}
                  >
                    <span
                      className={clsx(
                        "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
                        on
                          ? "border-foreground bg-foreground text-background"
                          : "border-border",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground">
                          {p.name}
                        </span>
                        {!p.builtin && (
                          <span className="rounded border border-foreground/30 px-1 font-mono text-[9px] text-foreground">
                            custom
                          </span>
                        )}
                      </span>
                      {p.description && (
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {p.description}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
            {(packs ?? []).length === 0 && (
              <li className="px-4 py-4 font-mono text-[11px] text-muted-foreground">
                no packs registered.
              </li>
            )}
          </ul>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
          <button
            onClick={onClose}
            className="rounded border border-border px-3 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            cancel
          </button>
          <button
            disabled={!path || initMut.isPending}
            onClick={() => initMut.mutate()}
            className="rounded border border-foreground bg-foreground px-3 py-1 font-mono text-xs text-background hover:opacity-90 disabled:opacity-40"
          >
            {initMut.isPending ? "creating…" : "gc init + import"}
          </button>
        </div>
      </div>
    </div>
  );
}
