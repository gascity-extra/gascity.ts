import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import clsx from "clsx";

import { AppShell } from "@/components/AppShell";
import {
  gcFormulaRun,
  gcFormulaRunStatus,
  gcFormulaShow,
} from "@/../server/gc.functions";
import type { FormulaStep } from "@/lib/types";

export const Route = createFileRoute("/formulas/$name")({
  head: ({ params }) => ({
    meta: [{ title: `${params.name} — formula` }],
  }),
  component: FormulaDetail,
});

function FormulaDetail() {
  const { name } = Route.useParams();
  const show = useServerFn(gcFormulaShow);
  const status = useServerFn(gcFormulaRunStatus);
  const run = useServerFn(gcFormulaRun);
  const qc = useQueryClient();
  const [live, setLive] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["gc", "formula", name],
    queryFn: () => show({ data: { name }}),
  });

  const { data: runtime } = useQuery({
    queryKey: ["gc", "formula", name, "status"],
    queryFn: () => status({ data: { name }}),
    enabled: live,
    refetchInterval: 2000,
  });

  const runMut = useMutation({
    mutationFn: () => run({ data: { name }}),
    onSuccess: () => {
      setLive(true);
      qc.invalidateQueries({ queryKey: ["gc", "formula", name, "status"] });
    },
  });

  const steps = mergeSteps(detail?.formula?.steps, runtime?.steps);

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/formulas"
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              ← formulas
            </Link>
            <h1 className="font-mono text-sm">{name}</h1>
            {detail?.formula?.contract && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {detail.formula.contract}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLive((v) => !v)}
              className={clsx(
                "rounded border px-2 py-0.5 font-mono text-[11px]",
                live
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {live ? "live ✓" : "live"}
            </button>
            <button
              onClick={() => runMut.mutate()}
              disabled={runMut.isPending}
              className="rounded border border-foreground bg-foreground px-2 py-0.5 font-mono text-[11px] text-background disabled:opacity-40"
            >
              run
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto border-r border-border">
            <div className="border-b border-border px-6 py-2 font-mono text-[11px] text-muted-foreground">
              graph · {steps.length} step{steps.length === 1 ? "" : "s"}
            </div>
            {isLoading && (
              <div className="px-6 py-4 font-mono text-xs text-muted-foreground">
                loading…
              </div>
            )}
            {!isLoading && !steps.length && (
              <div className="px-6 py-8 font-mono text-xs text-muted-foreground">
                no graph data. <code>gc formula compile {name} --json</code>
                {" "}may not be available; raw <code>show</code> output on the right.
              </div>
            )}
            <ul>
              {steps.map((s) => (
                <li
                  key={s.id}
                  className="border-b border-border px-6 py-2.5"
                >
                  <div className="flex items-center gap-2 font-mono text-sm">
                    <StepStatusDot status={s.status} />
                    <code className="text-foreground">{s.id}</code>
                    {s.agent && (
                      <span className="text-muted-foreground">
                        → {s.agent}
                      </span>
                    )}
                    {s.status && (
                      <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                        {s.status}
                        {s.bead_id ? ` · ${s.bead_id}` : ""}
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {s.description}
                    </div>
                  )}
                  {!!s.depends_on?.length && (
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      depends on: {s.depends_on.join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <aside className="w-[420px] shrink-0 overflow-y-auto bg-card">
            <div className="border-b border-border px-6 py-2 font-mono text-[11px] text-muted-foreground">
              gc formula show
            </div>
            <pre className="overflow-auto px-6 py-3 font-mono text-[11px] leading-relaxed">
              {detail?.raw ?? "loading…"}
            </pre>
            {runMut.data && (
              <>
                <div className="border-y border-border px-6 py-2 font-mono text-[11px] text-muted-foreground">
                  last run
                </div>
                <pre className="overflow-auto px-6 py-3 font-mono text-[11px] leading-relaxed">
                  {runMut.data.output}
                </pre>
              </>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function StepStatusDot({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const cls =
    s === "closed" || s === "done"
      ? "bg-foreground"
      : s === "in_progress" || s === "running"
        ? "live-dot"
        : s === "blocked" || s === "failed"
          ? "bg-destructive"
          : "bg-border";
  return <span className={clsx("inline-block h-1.5 w-1.5 rounded-full", cls)} />;
}

function mergeSteps(
  defs: FormulaStep[] | undefined,
  runtime: FormulaStep[] | undefined,
): FormulaStep[] {
  if (!defs?.length && !runtime?.length) return [];
  if (!defs?.length) return runtime ?? [];
  if (!runtime?.length) return defs;
  const byId = new Map(runtime.map((r) => [r.id, r]));
  return defs.map((d) => {
    const r = byId.get(d.id);
    return r ? { ...d, status: r.status, bead_id: r.bead_id } : d;
  });
}
