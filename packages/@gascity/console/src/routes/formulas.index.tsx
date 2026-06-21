import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/AppShell";
import { gcListFormulas } from "@/lib/gc.functions";

export const Route = createFileRoute("/formulas/")({
  head: () => ({ meta: [{ title: "Formulas — gc console" }] }),
  component: FormulasPage,
});

function FormulasPage() {
  const list = useServerFn(gcListFormulas);
  const { data, isLoading } = useQuery({
    queryKey: ["gc", "formulas"],
    queryFn: () => list(),
    refetchInterval: 10_000,
  });

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h1 className="font-mono text-sm">formulas</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            v2 = graph contract · click to view + run
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
              no formulas. write one in <code>formulas/&lt;name&gt;.toml</code>.
            </div>
          )}
          <ul>
            {(data ?? []).map((f) => (
              <li
                key={f.name}
                className="border-b border-border hover:bg-muted/40"
              >
                <Link
                  to="/formulas/$name"
                  params={{ name: f.name }}
                  className="grid grid-cols-[1fr_120px] items-center gap-3 px-6 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-sm text-foreground">
                      {f.name}
                    </div>
                    {f.description && (
                      <div className="truncate font-mono text-[11px] text-muted-foreground">
                        {f.description}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {f.contract ?? "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
