import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Command } from "cmdk";

import clsx from "clsx";

import {
  gcHealth,
  gcSupervisorLogs,
  gcSupervisorRestart,
  gcSupervisorStart,
  gcSupervisorStop,
  gcVersion,
} from "@/lib/gc.functions";

const NAV = [
  { to: "/", label: "Sessions", key: "s" },
  { to: "/mail", label: "Mail", key: "m" },
  { to: "/beads", label: "Beads", key: "b" },
  { to: "/formulas", label: "Formulas", key: "f" },
  { to: "/orders", label: "Orders", key: "o" },
  { to: "/cities", label: "Cities", key: "c" },
  { to: "/marketplace", label: "Marketplace", key: "k" },
  { to: "/endpoints", label: "Endpoints", key: "e" },
] as const;


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [supervisorOpen, setSupervisorOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (isTyping) return;
      if (e.key === "n") {
        e.preventDefault();
        setComposerOpen(true);
        return;
      }
      if (e.key === "v") {
        e.preventDefault();
        setSupervisorOpen((v) => !v);
        return;
      }
      const hit = NAV.find((n) => n.key === e.key.toLowerCase());
      if (hit) {
        e.preventDefault();
        navigate({ to: hit.to });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);


  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header
        onPalette={() => setPaletteOpen(true)}
        supervisorOpen={supervisorOpen}
        onSupervisorToggle={() => setSupervisorOpen((v) => !v)}
        onSupervisorClose={() => setSupervisorOpen(false)}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar pathname={pathname} onSling={() => setComposerOpen(true)} />
        <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSling={() => {
          setPaletteOpen(false);
          setComposerOpen(true);
        }}
        onSupervisor={() => {
          setPaletteOpen(false);
          setSupervisorOpen(true);
        }}
      />
      <SlingDrawer open={composerOpen} onOpenChange={setComposerOpen} />
    </div>
  );
}

// Supervisor lifecycle phases. Cities are deliberately out of scope
// here — the popover only reflects whether the *supervisor* is up
// and what we can do about it (start / stop / restart).
type Phase = "down" | "up" | "starting" | "stopping";

// localStorage key for the operator's chosen city directory. Persisted
// across reloads so they don't have to re-type it every time they open
function Header({
  onPalette,
  supervisorOpen,
  onSupervisorToggle,
  onSupervisorClose,
}: {
  onPalette: () => void;
  supervisorOpen: boolean;
  onSupervisorToggle: () => void;
  onSupervisorClose: () => void;
}) {
  const health = useServerFn(gcHealth);
  const version = useServerFn(gcVersion);
  // The Header just reflects the supervisor's reachability — the
  // server resolves the URL itself (env / supervisor.toml / default).
  // No localStorage state, no UI override here — the popover doesn't
  // expose the URL field anymore either, since "is supervisor up?" is
  // the only thing this header should answer.
  const { data } = useQuery({
    queryKey: ["gc", "health"],
    queryFn: () => health() as Promise<{
      reachable: boolean
      baseUrl: string
      version: string
      error?: string
    }>,
    refetchInterval: 5000,
  });
  const { data: v } = useQuery({
    queryKey: ["gc", "version"],
    queryFn: () => version() as Promise<{ version: string }>,
    refetchInterval: 60000,
  });
  const reachable = data?.reachable ?? false;

  return (
    <header className="relative flex h-11 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-3">
        <div className="font-mono text-[13px] tracking-tight">
          <span className="text-muted-foreground">gc</span>
          <span className="text-foreground"> · console</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onSupervisorToggle}
          aria-expanded={supervisorOpen}
          title="supervisor (v)"
          className={clsx(
            "flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-xs transition-colors",
            supervisorOpen
              ? "border-foreground/40 bg-muted text-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <StatusDot reachable={reachable} />
          <span>
            supervisor{" "}
            <span className="text-foreground">
              {data?.baseUrl?.replace(/^https?:\/\//, "") ?? "—"}
            </span>
          </span>
          <span className="text-muted-foreground">
            · {v?.version ?? data?.version ?? "—"}
          </span>
        </button>
        <button
          onClick={onPalette}
          className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          ⌘K
        </button>
      </div>
      {supervisorOpen && (
        <SupervisorPopover
          onClose={onSupervisorClose}
          health={data}
          version={v}
        />
      )}
    </header>
  );
}

function StatusDot({
  reachable,
  phase,
}: {
  reachable?: boolean;
  phase?: Phase;
}) {
  // Map a boolean (the Header's view of supervisor reachability) to a
  // phase, then colour the dot. The popover passes `phase` directly
  // and skips this fallback.
  const p: Phase = phase ?? (reachable ? "up" : "down");
  const cls =
    p === "up"
      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
      : p === "starting" || p === "stopping"
        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse"
        : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]";
  return <span className={clsx("inline-block h-1.5 w-1.5 rounded-full", cls)} />;
}

// Copy a string to the clipboard with a brief "copied!" confirmation.
// Uses the navigator Clipboard API where available; falls back to a hidden
// textarea + execCommand for older browsers (and the test browser context
// where clipboard may not be granted). The fallback also works in headless
// Chromium without permissions.
async function copyText(text: string, setFlag: (b: boolean) => void): Promise<void> {
  let ok = false;
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch {
    // fall through to execCommand
  }
  if (!ok && typeof document !== "undefined") {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      // NOSONAR: fallback for older browsers where Clipboard API is unavailable
      ok = document.execCommand("copy");
      ta.remove();
    } catch {
      // Both paths failed. The operator can still drag-select the pre block
      // and Cmd+C — we just don't show "copied!".
    }
  }
  if (ok) {
    setFlag(true);
    setTimeout(() => setFlag(false), 1_200);
  }
}

function getDisplayLog(output: string | undefined, clearedAt: number | null): string | undefined {
  return output && clearedAt && Date.now() - clearedAt < 50 ? "" : output;
}

function getRefetchInterval(logPaused: boolean, transition: null | "starting" | "stopping"): number | false {
  if (logPaused) return false;
  return transition === "starting" ? 1000 : 3000;
}

function SupervisorPopover({
  onClose,
  health,
  version,
}: {
  onClose: () => void;
  health:
    | {
        reachable: boolean
        baseUrl: string
        version: string
        error?: string | undefined
      }
    | undefined;
  version: { version: string } | undefined;
}) {
  const logs = useServerFn(gcSupervisorLogs);
  const supervisorStart = useServerFn(gcSupervisorStart);
  const supervisorStop = useServerFn(gcSupervisorStop);
  const restart = useServerFn(gcSupervisorRestart);
  const qc = useQueryClient();

  const [transition, setTransition] = useState<null | "starting" | "stopping">(null);
  const [console_, setConsole] = useState<string>("");
  const [copiedConsole, setCopiedConsole] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const transitionStart = useRef<number>(0);
  const [logFollowing, setLogFollowing] = useState(true);
  const [logPaused, setLogPaused] = useState(false);
  const [logClearedAt, setLogClearedAt] = useState<number | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  const displayLog = getDisplayLog(log?.output, logClearedAt);

  useEffect(() => {
    if (!logFollowing) return
    if (!logRef.current) return
    const el = logRef.current
    queueMicrotask(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [log?.output, logFollowing])

  useEffect(() => {
    if (!transition) return;
    const elapsed = Date.now() - transitionStart.current;
    if (
      transition === "starting" && health?.reachable ||
      transition === "stopping" && !health?.reachable ||
      elapsed > 35000
    ) {
      setTransition(null);
    }
  }, [transition, health?.reachable]);

  const refetchInterval = getRefetchInterval(logPaused, transition);

  const { data: log } = useQuery({
    queryKey: ["gc", "supervisor-logs"],
    queryFn: () => logs({ data: { lines: 200 } }),
    refetchInterval,
  });

  // Supervisor lifecycle phase. Only two steady states — `down`
  // (supervisor not reachable) and `up` (supervisor reachable, no
  // city-state inference here). The optimistic `starting` /
  // `stopping` states clear as soon as health flips.
  const phase: Phase = getPhase(transition, health?.reachable);

  function getPhase(transition: string | null, reachable: boolean | undefined): Phase {
    if (transition) return transition as Phase;
    if (!reachable) return "down";
    return "up";
  }

  function appendConsole(cmd: string, out: string) {
    const ts = new Date().toLocaleTimeString();
    setConsole((c) =>
      (c ? c + "\n\n" : "") + `[${ts}] ${cmd}\n${out.trim() || "(no output)"}`,
    );
  }

  // The popover only controls the supervisor. Start maps to
// `gc supervisor start`, stop to `gc supervisor stop`, and restart
// goes through both. There is no `city-start` / `city-stop` path
// here — cities are managed via the /cities page or the operator's
// shell.
const startMut = useMutation({
    mutationFn: () => supervisorStart(),
    onMutate: () => {
      setTransition("starting");
      transitionStart.current = Date.now();
      appendConsole("$ gc supervisor start", "requesting…");
    },
    onSuccess: (r) => {
      appendConsole("$ gc supervisor start", r.output);
      if (!r.ok) {
        appendConsole("! gc supervisor start", `error: ${r.error ?? "unknown"}`);
      }
      // Clear the optimistic transition so the phase can flip back to
      // the steady state derived from the health query. Without this,
      // the popover stays stuck on "starting…" even after the daemon
      // is up.
      setTransition(null);
      qc.invalidateQueries({ queryKey: ["gc", "health"] });
    },
    onError: (e: unknown) => {
      appendConsole("! gc supervisor start", e instanceof Error ? e.message : String(e));
      setTransition(null);
    },
  });

const stopMut = useMutation({
    mutationFn: () => supervisorStop(),
    onMutate: () => {
      setTransition("stopping");
      transitionStart.current = Date.now();
      appendConsole("$ gc supervisor stop", "requesting…");
    },
    onSuccess: (r) => {
      appendConsole("$ gc supervisor stop", r.output);
      if (!r.ok) {
        appendConsole("! gc supervisor stop", `error: ${r.error ?? "unknown"}`);
      }
      setTransition(null);
      qc.invalidateQueries({ queryKey: ["gc", "health"] });
    },
    onError: (e: unknown) => {
      appendConsole("! gc supervisor stop", e instanceof Error ? e.message : String(e));
      setTransition(null);
    },
  });

const restartMut = useMutation({
    mutationFn: () => restart(),
    onMutate: () => {
      setTransition("stopping");
      transitionStart.current = Date.now();
      appendConsole("$ gc supervisor restart", "stopping + starting…");
    },
    onSuccess: (r) => {
      appendConsole("$ gc supervisor restart", r.output);
      if (!r.ok) appendConsole("! gc supervisor restart", `error: ${r.error ?? "unknown"}`);
      setTransition(null);
      qc.invalidateQueries({ queryKey: ["gc", "health"] });
    },
    onError: (e: unknown) => {
      appendConsole("! gc supervisor restart", e instanceof Error ? e.message : String(e));
      setTransition(null);
    },
  });

  const phaseLabel = getPhaseLabel(phase);

  function getPhaseLabel(phase: Phase): string {
    if (phase === "starting") return "starting…";
    if (phase === "stopping") return "stopping…";
    if (phase === "up") return "supervisor up";
    return "supervisor down";
  }

  // Button enablement: when down, only start is available; when up,
  // stop + restart are available; during a transition the other
  // buttons stay disabled to avoid double-fires.
  const canStart = phase === "down" && !transition;
  const canStop = phase === "up" && !transition;
  const canRestart = phase === "up" && !transition;
  const startKind = phase === "down" ? "supervisor-start" : null;
  const stopKind = phase === "up" ? "supervisor-stop" : null;
  const restartKind = phase === "up" ? "supervisor-restart" : null;

return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="absolute right-4 top-11 z-50 w-[620px] overflow-hidden rounded-md border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-xs">
            <StatusDot phase={phase} />
            <span className="text-foreground">{phaseLabel}</span>
            <span className="text-muted-foreground">
              · {health?.baseUrl?.replace(/^https?:\/\//, "") ?? "—"}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => startMut.mutate()}
              disabled={!canStart}
              aria-label="start supervisor"
              title="start the gc supervisor daemon"
              data-testid="supervisor-start"
              data-action-kind={startKind ?? "unavailable"}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:bg-muted disabled:opacity-40"
            >
              start
            </button>
            <button
              onClick={() => restartMut.mutate()}
              disabled={!canRestart}
              aria-label="restart supervisor"
              title="restart the gc supervisor daemon"
              data-testid="supervisor-restart"
              data-action-kind={restartKind ?? "unavailable"}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:bg-muted disabled:opacity-40"
            >
              restart
            </button>
            <button
              onClick={() => stopMut.mutate()}
              disabled={!canStop}
              aria-label="stop supervisor"
              title="stop the gc supervisor daemon"
              data-testid="supervisor-stop"
              data-action-kind={stopKind ?? "unavailable"}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:bg-muted disabled:opacity-40"
            >
              stop
            </button>
          </div>
        </div>

        {/* Action console — captures the raw output of every `gc
            supervisor start/stop/restart` invocation we make. When
            the supervisor is launched in tmux / a background service
            the stdout/stderr we get back is the *only* signal that
            something went wrong on the operator's side (auth, port
            already taken, missing binary, dolt identity probe, ...),
            so we surface it verbatim. This is separate from the
            supervisor log below — that one streams the supervisor's
            own `/v0/events` history, which only fills in once the
            supervisor is up and healthy. */}
        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              action console
            </span>
            <div className="flex items-center gap-2">
              {console_ && (
                <button
                  onClick={() => copyText(console_, setCopiedConsole)}
                  title="copy action console to clipboard"
                  data-testid="action-console-copy"
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {copiedConsole ? "copied!" : "copy"}
                </button>
              )}
              {console_ && (
                <button
                  onClick={() => setConsole("")}
                  title="clear the action console"
                  data-testid="action-console-clear"
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                >
                  clear
                </button>
              )}
            </div>
          </div>
          <pre
            className="max-h-32 overflow-auto whitespace-pre-wrap break-words px-4 pb-2 font-mono text-[11px] leading-relaxed text-foreground"
            data-testid="action-console-text"
          >
            {console_ || (
              <span className="italic opacity-70 text-muted-foreground">
                (no actions yet — click start / restart / stop above)
              </span>
            )}
          </pre>
        </div>

        {/* Supervisor log — the operator's primary feedback channel.
            Show `gc://v0/events?since=1h` content with copy / clear /
            follow / pause controls. "Follow" auto-scrolls to the
            newest line; "pause" freezes the view so the operator can
            inspect without the log jumping. */}
        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              supervisor log
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <span data-testid="supervisor-log-source">
                {log?.source ?? ""}
              </span>
              <button
                onClick={() => setLogFollowing((v) => !v)}
                title={
                  logFollowing
                    ? "stop auto-scrolling"
                    : "auto-scroll to newest line"
                }
                data-testid="supervisor-log-follow"
                className={clsx(
                  "hover:text-foreground",
                  logFollowing && "text-foreground",
                )}
              >
                {logFollowing ? "following" : "follow"}
              </button>
              <button
                onClick={() => setLogPaused((v) => !v)}
                title={logPaused ? "resume polling" : "pause polling"}
                data-testid="supervisor-log-pause"
                className={clsx(
                  "hover:text-foreground",
                  logPaused && "text-foreground",
                )}
              >
                {logPaused ? "paused" : "pause"}
              </button>
              {log?.output && (
                <button
                  onClick={() => copyText(log.output, setCopiedLog)}
                  title="copy supervisor log to clipboard"
                  data-testid="supervisor-log-copy"
                  className="hover:text-foreground"
                >
                  {copiedLog ? "copied!" : "copy"}
                </button>
              )}
              <button
                onClick={() => setLogClearedAt(Date.now())}
                title="clear the log buffer (next fetch will repopulate)"
                data-testid="supervisor-log-clear"
                className="hover:text-foreground"
              >
                clear
              </button>
            </div>
          </div>
          <pre
            ref={logRef}
            className="max-h-80 overflow-auto px-4 pb-3 font-mono text-[11px] leading-relaxed text-muted-foreground"
            data-testid="supervisor-log-text"
          >
            {(() => {
              // Three distinct visual states:
              //   1. operator cleared the buffer (displayLog === "")
              //   2. upstream placeholder ("(no supervisor events...)")
              //   3. waiting for first poll ("(loading…)")
              // All three render in italic / dimmer than real log
              // content so the operator can tell at a glance that
              // there is nothing meaningful yet, vs. real events.
              const text =
                displayLog ||
                log?.output ||
                "(loading…)"
              const isPlaceholder =
                text === displayLog
                  ? false
                  : text === log?.output
                    ? log.output.startsWith('(no supervisor events')
                    : true
              return (
                <span className={isPlaceholder ? "italic opacity-70" : undefined}>
                  {text}
                </span>
              )
            })()}
          </pre>
        </div>
      </div>
    </>
  );
}

function Sidebar({
  pathname,
  onSling,
}: {
  pathname: string;
  onSling: () => void;
}) {
  return (
    <nav className="flex h-full w-48 shrink-0 flex-col overflow-y-auto border-r border-border">
      <button
        onClick={onSling}
        className="m-3 rounded border border-foreground bg-foreground px-3 py-1.5 text-left font-mono text-xs text-background hover:opacity-90"
      >
        + sling task <span className="opacity-60">n</span>
      </button>
      <ul className="px-1">
        {NAV.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/" || pathname.startsWith("/sessions")
              : pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={clsx(
                  "flex items-center justify-between rounded px-3 py-1.5 font-mono text-[13px]",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{item.label}</span>
                <span className="opacity-50">{item.key}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto p-3 font-mono text-[11px] leading-snug text-muted-foreground">
        local · 127.0.0.1
        <br />
        node-pty required for attach
      </div>
    </nav>
  );
}

function CommandPalette({
  open,
  onOpenChange,
  onSling,
  onSupervisor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSling: () => void;
  onSupervisor: () => void;
}) {
  const navigate = useNavigate();
  if (!open) return null;
  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 pt-[15vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-md border border-border bg-card"
      >
        <Command label="Command palette">
          <Command.Input
            autoFocus
            placeholder="type a command…"
            className="w-full bg-transparent px-4 py-3 font-mono text-sm outline-none"
          />
          <Command.List className="max-h-72 overflow-y-auto border-t border-border">
            <Command.Empty className="px-4 py-3 font-mono text-xs text-muted-foreground">
              no match
            </Command.Empty>
            <Command.Group heading="actions">
              <PaletteItem onSelect={onSling}>sling new task</PaletteItem>
              <PaletteItem onSelect={onSupervisor}>supervisor panel</PaletteItem>
            </Command.Group>
            <Command.Group heading="navigate">
              <PaletteItem onSelect={() => go("/")}>sessions</PaletteItem>
              <PaletteItem onSelect={() => go("/mail")}>mail</PaletteItem>
              <PaletteItem onSelect={() => go("/beads")}>beads</PaletteItem>
              <PaletteItem onSelect={() => go("/formulas")}>formulas</PaletteItem>
              <PaletteItem onSelect={() => go("/orders")}>orders</PaletteItem>
              <PaletteItem onSelect={() => go("/cities")}>cities</PaletteItem>
              <PaletteItem onSelect={() => go("/marketplace")}>marketplace</PaletteItem>
              <PaletteItem onSelect={() => go("/endpoints")}>endpoints</PaletteItem>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function PaletteItem({
  children,
  onSelect,
}: {
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="cursor-pointer px-4 py-2 font-mono text-xs text-foreground data-[selected=true]:bg-muted"
    >
      {children}
    </Command.Item>
  );
}


import { SlingComposer } from "./SlingComposer";

function SlingDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 pt-[12vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-card"
      >
        <SlingComposer onDone={() => onOpenChange(false)} />
      </div>
    </div>
  );
}
