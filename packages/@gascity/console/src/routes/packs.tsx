import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import clsx from "clsx";

import { AppShell } from "@/components/AppShell";
import {
  gcListPacks,
  gcRegisterPack,
  gcUnregisterPack,
} from "@/lib/gc.functions";

export const Route = createFileRoute("/packs")({
  head: () => ({ meta: [{ title: "Packs — gc console" }] }),
  component: PacksPage,
});

function PacksPage() {
  const list = useServerFn(gcListPacks);
  const register = useServerFn(gcRegisterPack);
  const unregister = useServerFn(gcUnregisterPack);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["gc", "packs"],
    queryFn: () => list(),
  });

  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMut = useMutation({
    mutationFn: (input: { name: string; source: string; description?: string }) =>
      register({ data: input }),
    onSuccess: (r) => {
      if (!r.ok) {
        setError(r.error ?? "register failed");
        return;
      }
      setName("");
      setSource("");
      setDescription("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["gc", "packs"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });

  const unregisterMut = useMutation({
    mutationFn: (n: string) => unregister({ data: { name: n } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gc", "packs"] }),
  });

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h1 className="font-mono text-sm">packs</h1>
          <span className="font-mono text-[11px] text-muted-foreground">
            preconfigured imports for <code>gc import add</code>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="px-6 py-4 font-mono text-xs text-muted-foreground">
              loading…
            </div>
          )}
          <ul>
            {(data ?? []).map((p) => (
              <li
                key={p.name}
                className="grid grid-cols-[1fr_auto] items-start gap-3 border-b border-border px-6 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">
                      {p.name}
                    </span>
                    <span
                      className={clsx(
                        "rounded border px-1.5 py-px font-mono text-[10px]",
                        p.builtin
                          ? "border-border text-muted-foreground"
                          : "border-foreground/30 text-foreground",
                      )}
                    >
                      {p.builtin ? "builtin" : "custom"}
                    </span>
                  </div>
                  {p.description && (
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {p.description}
                    </div>
                  )}
                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {p.source}
                  </div>
                </div>
                {!p.builtin && (
                  <button
                    onClick={() => unregisterMut.mutate(p.name)}
                    className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border bg-card">
          <div className="border-b border-border px-6 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            register a pack
          </div>
          <form
            className="grid grid-cols-[160px_1fr_120px] gap-2 px-6 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name || !source) return;
              registerMut.mutate({
                name,
                source,
                description: description || undefined,
              });
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="name (e.g. bmad)"
              className="rounded border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:border-foreground/40"
            />
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="source (https://github.com/…//path  or local path)"
              className="rounded border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:border-foreground/40"
            />
            <button
              type="submit"
              disabled={!name || !source || registerMut.isPending}
              className="rounded border border-foreground bg-foreground px-3 py-1 font-mono text-xs text-background hover:opacity-90 disabled:opacity-40"
            >
              register
            </button>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="description (optional)"
              className="col-span-3 rounded border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:border-foreground/40"
            />
            {error && (
              <div className="col-span-3 font-mono text-[11px] text-red-500">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </AppShell>
  );
}
