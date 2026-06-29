import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import clsx from "clsx";

import { AppShell } from "@/components/AppShell";
import {
  gcListOrders,
  gcOrderRun,
  gcOrderSetEnabled,
  gcOrderShow,
} from "@/lib/gc.functions";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — gc console" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const list = useServerFn(gcListOrders);
  const run = useServerFn(gcOrderRun);
  const show = useServerFn(gcOrderShow);
  const setEnabled = useServerFn(gcOrderSetEnabled);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["gc", "orders"],
    queryFn: () => list(),
    refetchInterval: 10_000,
  });

  const [selected, setSelected] = useState<string | null>(null);

  const { data: detail } = useQuery({
    queryKey: ["gc", "order", selected],
    queryFn: () => show({ data: { name: selected! }}),
    enabled: !!selected,
  });

  const runMut = useMutation({
    mutationFn: (name: string) => run({ data: { name }}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gc", "orders"] }),
  });

  const toggleMut = useMutation({
    mutationFn: (p: { name: string; enabled: boolean }) =>
      setEnabled({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gc", "orders"] }),
  });

  return (
    <AppShell>
      <div className="flex h-full">
        <div className="flex flex-1 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <h1 className="font-mono text-sm">orders</h1>
            <span className="font-mono text-[11px] text-muted-foreground">
              orchestrator ticks every 30s
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="px-6 py-4 font-mono text-xs text-muted-foreground">
                loading…
              </div>
            )}
            {!isLoading && !data?.length && (
              <div className="px-6 py-8 font-mono text-xs text-muted-foreground">
                no orders. drop a <code>.toml</code> into <code>orders/</code>.
              </div>
            )}
            <ul>
              {(data ?? []).map((o) => {
                const active = selected === o.name;
                return (
                  <button
                    key={o.name}
                    onClick={() => setSelected(o.name)}
                    className={clsx(
                      "grid cursor-pointer grid-cols-[1fr_70px_80px_90px_auto] items-center gap-3 border-b border-border px-6 py-2.5 w-full text-left",
                      active ? "bg-muted" : "hover:bg-muted/40",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-sm text-foreground">
                        {o.name}
                        {o.due && (
                          <span className="ml-2 inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" />
                            due
                          </span>
                        )}
                        {" "}
                      </div>
                      {o.description && (
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {o.description}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {o.type}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {o.trigger}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {o.interval ?? o.schedule ?? o.on ?? "—"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          toggleMut.mutate({
                            name: o.name,
                            enabled: !(o.enabled ?? true),
                          })
                        }
                        className={clsx(
                          "rounded border px-2 py-0.5 font-mono text-[11px]",
                          o.enabled === false
                            ? "border-border text-muted-foreground hover:text-foreground"
                            : "border-foreground text-foreground",
                        )}
                        title="toggle enabled in the order's TOML"
                      >
                        {o.enabled === false ? "off" : "on"}
                      </button>
                      <button
                        onClick={() => runMut.mutate(o.name)}
                        disabled={runMut.isPending}
                        className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
                      >
                        fire
                      </button>
                    </div>
                  </button>
                );
              })}
            </ul>
          </div>
          {runMut.data && (
            <div className="border-t border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-6 py-2">
                <span className="font-mono text-xs text-muted-foreground">
                  last fire {runMut.data.bead_id ? `· bead ${runMut.data.bead_id}` : ""}
                </span>
                <button
                  onClick={() => runMut.reset()}
                  className="font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  clear
                </button>
              </div>
              <pre className="max-h-40 overflow-auto px-6 py-3 font-mono text-[11px] leading-relaxed">
                {runMut.data.output}
              </pre>
            </div>
          )}
        </div>
        <aside className="w-[420px] shrink-0 overflow-y-auto bg-card">
          {!selected && (
            <div className="px-6 py-8 font-mono text-xs text-muted-foreground">
              select an order to inspect.
            </div>
          )}
          {selected && (
            <div className="flex flex-col">
              <div className="border-b border-border px-6 py-3 font-mono text-sm">
                {selected}
              </div>
              <pre className="overflow-auto px-6 py-3 font-mono text-[11px] leading-relaxed text-foreground">
                {detail?.output ?? "loading…"}
              </pre>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
