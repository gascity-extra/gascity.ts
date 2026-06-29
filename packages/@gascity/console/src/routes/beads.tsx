import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import clsx from "clsx";

import { AppShell } from "@/components/AppShell";
import { gcCloseBead, gcListBeads } from "@/lib/gc.functions";

export const Route = createFileRoute("/beads")({
  head: () => ({ meta: [{ title: "Beads — gc console" }] }),
  component: BeadsPage,
});

const FILTERS = ["all", "open", "in_progress", "closed"] as const;

function BeadsPage() {
  const list = useServerFn(gcListBeads);
  const close = useServerFn(gcCloseBead);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("open");

  const { data, isLoading } = useQuery({
    queryKey: ["gc", "beads", filter],
    queryFn: () =>
      list({ data: { status: filter === "all" ? undefined : filter }}),
    refetchInterval: 4000,
  });

  const closeMut = useMutation({
    mutationFn: (id: string) => close({ data: { id }}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gc", "beads"] }),
  });

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h1 className="font-mono text-sm">beads</h1>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "rounded border px-2 py-0.5 font-mono text-[11px]",
                  filter === f
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
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
              no beads. Try slinging one with <code>n</code>.
            </div>
          )}
          <ul>
            {(data ?? []).map((b) => (
              <li
                key={b.id}
                className="grid grid-cols-[80px_1fr_120px_80px_80px] items-center gap-3 border-b border-border px-6 py-2 hover:bg-muted/40"
              >
                <code className="font-mono text-[11px] text-muted-foreground">
                  {b.id}
                </code>
                <span className="truncate font-mono text-sm text-foreground">
                  {b.title}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {b.type}
                </span>
                <span
                  className={clsx(
                    "font-mono text-[11px]",
                    b.status === "closed"
                      ? "text-muted-foreground line-through"
                      : b.status === "in_progress"
                        ? "text-foreground"
                        : "text-foreground",
                  )}
                >
                  {b.status}
                </span>
                <div className="flex justify-end">
                  {b.status !== "closed" && (
                    <button
                      onClick={() => closeMut.mutate(b.id)}
                      className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      close
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
