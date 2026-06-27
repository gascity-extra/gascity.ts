import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";

import {
  gcListSessions,
  gcSessionNudge,
  gcSessionReset,
  gcTmuxStatus,
} from "@/lib/gc.functions";

function relTime(iso?: string) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function SessionsList() {
  const list = useServerFn(gcListSessions);
  const reset = useServerFn(gcSessionReset);
  const nudge = useServerFn(gcSessionNudge);
  const tmuxStatusFn = useServerFn(gcTmuxStatus);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["gc", "sessions"],
    queryFn: () => list(),
    refetchInterval: 2000,
  });

  const { data: tmux } = useQuery({
    queryKey: ["gc", "tmux-status"],
    queryFn: () => tmuxStatusFn() as Promise<{
      available: boolean
      tmuxBin: string
      version?: string
      error?: string
    }>,
    refetchInterval: 10_000,
  });

  const resetMut = useMutation({
    mutationFn: (name: string) => reset({ data: { name }}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gc", "sessions"] }),
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="font-mono text-sm text-foreground">sessions</h1>
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <TmuxBadge
            available={!!tmux?.available}
            version={tmux?.version}
            bin={tmux?.tmuxBin}
          />
          <span>
            {data?.length ?? 0} · refresh 2s
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-6 py-4 font-mono text-xs text-muted-foreground">
            loading…
          </div>
        )}
        {error && (
          <div className="px-6 py-4 font-mono text-xs text-destructive">
            {String(error)}
          </div>
        )}
        {!isLoading && !data?.length && (
          <Empty />
        )}
        <ul>
          {(data ?? []).map((s) => {
            const live =
              s.status === "running" || s.status === "active" || s.status === "live";
            return (
              <li
                key={s.name}
                className="grid grid-cols-[1fr_120px_80px_80px_200px] items-center gap-3 border-b border-border px-6 py-2.5 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <Link
                    to="/sessions/$name"
                    params={{ name: s.name }}
                    className="block truncate font-mono text-sm text-foreground hover:underline"
                  >
                    {s.name}
                  </Link>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    agent: {s.agent}
                    {s.provider ? ` · ${s.provider}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={clsx(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      live ? "live-dot" : "bg-muted-foreground",
                    )}
                  />
                  <span className={live ? "text-foreground" : "text-muted-foreground"}>
                    {s.status}
                  </span>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {relTime(s.last_activity_at)}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {relTime(s.started_at)}
                </div>
                <div className="flex justify-end gap-1.5">
                  <Link
                    to="/sessions/$name"
                    params={{ name: s.name }}
                    className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
                  >
                    attach
                  </Link>
                  <button
                    onClick={() => {
                      const msg = window.prompt(`nudge ${s.name}:`);
                      if (msg) nudge({ data: { name: s.name, message: msg }});
                    }}
                    className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    nudge
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`reset ${s.name}?`)) resetMut.mutate(s.name);
                    }}
                    className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    reset
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="mx-auto mt-24 max-w-md px-6 text-center">
      <div className="font-mono text-sm text-foreground">no sessions</div>
      <div className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed">
        Press <span className="rounded border border-border px-1">n</span> to
        sling a task. A new on-demand tmux session will spin up under{" "}
        <code>gc sling &lt;agent&gt; "…"</code> and appear here.
      </div>
      <div className="mt-4 font-mono text-[11px] text-muted-foreground">
        If the supervisor isn't reachable, check{" "}
        <code>GC_API_BASE_URL</code> and that <code>gc start</code> is running.
      </div>
    </div>
  );
}

function TmuxBadge({
  available,
  version,
  bin,
}: {
  available: boolean;
  version?: string;
  bin?: string;
}) {
  return (
    <span
      title={
        available
          ? `tmux provider ready · ${bin ?? "tmux"} ${version ?? ""}`
          : "tmux not on PATH — terminal bridge is read-only (peek/nudge)"
      }
      className={clsx(
        "flex items-center gap-1.5 rounded border px-1.5 py-0.5",
        available
          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
          : "border-border text-muted-foreground",
      )}
    >
      <span
        className={clsx(
          "inline-block h-1.5 w-1.5 rounded-full",
          available ? "bg-emerald-500" : "bg-muted-foreground",
        )}
      />
      tmux
    </span>
  );
}
