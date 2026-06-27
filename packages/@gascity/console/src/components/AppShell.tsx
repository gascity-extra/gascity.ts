import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Command } from "cmdk";

import clsx from "clsx";

import {
  gcCityStart,
  gcCityStatus,
  gcCityStop,
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
  { to: "/packs", label: "Packs", key: "p" },
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        onPalette={() => setPaletteOpen(true)}
        supervisorOpen={supervisorOpen}
        onSupervisorToggle={() => setSupervisorOpen((v) => !v)}
        onSupervisorClose={() => setSupervisorOpen(false)}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar pathname={pathname} onSling={() => setComposerOpen(true)} />
        <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
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

type Phase = "down" | "up-stopped" | "up-running" | "starting" | "stopping";

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
  const p: Phase = phase ?? (reachable ? "up-running" : "down");
  const cls =
    p === "up-running"
      ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
      : p === "up-stopped"
        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]"
        : p === "starting" || p === "stopping"
          ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse"
          : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]";
  return <span className={clsx("inline-block h-1.5 w-1.5 rounded-full", cls)} />;
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
  const cityStart = useServerFn(gcCityStart);
  const cityStop = useServerFn(gcCityStop);
  const supervisorStart = useServerFn(gcSupervisorStart);
  const supervisorStop = useServerFn(gcSupervisorStop);
  const restart = useServerFn(gcSupervisorRestart);
  const status = useServerFn(gcCityStatus);
  const qc = useQueryClient();

  const [transition, setTransition] = useState<null | "starting" | "stopping">(null);
  const [console_, setConsole] = useState<string>("");
  const [copiedConsole, setCopiedConsole] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const transitionStart = useRef<number>(0);

  // Copy a string to the clipboard with a brief "copied!" confirmation.
  // Uses the navigator Clipboard API where available; falls back to a
  // hidden textarea + execCommand for older browsers (and the test
  // browser context where clipboard may not be granted). The fallback
  // also works in headless Chromium without permissions.
  async function copyText(text: string, setFlag: (b: boolean) => void) {
    // Try the modern Clipboard API first; on any failure (browser
    // denial, headless context, sandboxed iframe) fall back to a hidden
    // textarea + execCommand, which works in headless Chromium without
    // clipboard permissions. Either way we surface "copied!" feedback
    // so the operator knows the action succeeded.
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
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        // Both paths failed. The operator can still drag-select the
        // pre block and Cmd+C — we just don't show "copied!".
      }
    }
    if (ok) {
      setFlag(true);
      setTimeout(() => setFlag(false), 1_200);
    }
  }

  const { data: log } = useQuery({
    queryKey: ["gc", "supervisor-logs"],
    queryFn: () => logs({ data: { lines: 200 } }),
    refetchInterval: 3000,
  });

  const { data: city } = useQuery({
    queryKey: ["gc", "city-status"],
    queryFn: () => status({ data: { lite: true } }),
    refetchInterval: 5000,
    // Always poll — when the supervisor is offline the server function
    // degrades to a silent empty state, so the cost is negligible.
    // Keeping the poll alive means the LED flips green the moment the
    // supervisor comes back, instead of staying red until the next page
    // load.
    enabled: true,
  });

  // Clear the "starting" transition once the city actually comes up;
  // clear the "stopping" transition once the city disappears. This is
  // what makes the LED green / amber behave deterministically instead of
  // just guessing based on the supervisor reachability.
  useEffect(() => {
    if (!transition) return;
    const elapsed = Date.now() - transitionStart.current;
    // Clear "starting" once the system has reached the target state.
    // For supervisor-start: supervisor reachable + city stopped is the
    // target. For city-start: city running is the target. For both we
    // accept either signal as success.
    if (
      transition === "starting" &&
      (health?.reachable || city?.running)
    ) {
      setTransition(null);
    } else if (
      transition === "stopping" &&
      (!city?.running || !health?.reachable)
    ) {
      setTransition(null);
    } else if (elapsed > 35000) {
      setTransition(null);
    }
  }, [city, transition, health?.reachable]);

  // Phase model:
  //   down        – supervisor unreachable
  //   up-stopped  – supervisor reachable, no city running (amber)
  //   up-running  – supervisor reachable, city running (green)
  //   starting    – optimistic: just clicked start, awaiting confirmation
  //   stopping    – optimistic: just clicked stop, awaiting confirmation
  const phase: Phase = transition
    ? transition
    : !health?.reachable
      ? "down"
      : city?.running
        ? "up-running"
        : "up-stopped";

  function appendConsole(cmd: string, out: string) {
    const ts = new Date().toLocaleTimeString();
    setConsole((c) =>
      (c ? c + "\n\n" : "") + `[${ts}] ${cmd}\n${out.trim() || "(no output)"}`,
    );
  }

  // Capture the phase at click time so the mutation's mutationFn and
// onSuccess/onError callbacks don't drift if React re-renders between
// the click and the network round-trip (StrictMode intentionally
// double-invokes useMutation in dev, so without this we'd see
// supervisor-start fire then city-start immediately after).
const startIntent = useRef<"supervisor-start" | "city-start" | null>(null)
const stopIntent = useRef<"supervisor-stop" | "city-stop" | null>(null)

function captureStartIntent(): "supervisor-start" | "city-start" | null {
  const intent = phase === "down" ? "supervisor-start" : phase === "up-stopped" ? "city-start" : null
  startIntent.current = intent
  return intent
}
function captureStopIntent(): "supervisor-stop" | "city-stop" | null {
  const intent = phase === "up-running" ? "city-stop" : phase === "up-stopped" ? "supervisor-stop" : null
  stopIntent.current = intent
  return intent
}

const startMut = useMutation({
    mutationFn: () => {
      const intent = startIntent.current
      if (intent === "supervisor-start") return supervisorStart()
      if (intent === "city-start") return cityStart({ data: {} })
      throw new Error(`no start intent captured (phase=${phase})`)
    },
    onMutate: () => {
      setTransition("starting")
      transitionStart.current = Date.now()
      const label =
        startIntent.current === "supervisor-start"
          ? "$ gc supervisor start"
          : "$ gc city start"
      appendConsole(label, "requesting…")
    },
    onSuccess: (r) => {
      const label =
        startIntent.current === "supervisor-start"
          ? "$ gc supervisor start"
          : "$ gc city start"
      appendConsole(label, r.output)
      if (!r.ok) {
        appendConsole(`! ${label.replace(/^\$ /, "")}`, `error: ${r.error ?? "unknown"}`)
      }
      qc.invalidateQueries({ queryKey: ["gc", "health"] })
      qc.invalidateQueries({ queryKey: ["gc", "city-status"] })
    },
    onError: (e: unknown) => {
      appendConsole("! start", e instanceof Error ? e.message : String(e))
      setTransition(null)
    },
})

const stopMut = useMutation({
    mutationFn: () => {
      const intent = stopIntent.current
      if (intent === "supervisor-stop") return supervisorStop()
      if (intent === "city-stop") return cityStop({ data: {} })
      throw new Error(`no stop intent captured (phase=${phase})`)
    },
    onMutate: () => {
      setTransition("stopping")
      transitionStart.current = Date.now()
      const label =
        stopIntent.current === "supervisor-stop"
          ? "$ gc supervisor stop"
          : "$ gc city stop"
      appendConsole(label, "requesting…")
    },
    onSuccess: (r) => {
      const label =
        stopIntent.current === "supervisor-stop"
          ? "$ gc supervisor stop"
          : "$ gc city stop"
      appendConsole(label, r.output)
      if (!r.ok) {
        appendConsole(`! ${label.replace(/^\$ /, "")}`, `error: ${r.error ?? "unknown"}`)
      }
      qc.invalidateQueries({ queryKey: ["gc", "health"] })
      qc.invalidateQueries({ queryKey: ["gc", "city-status"] })
    },
    onError: (e: unknown) => {
      appendConsole("! stop", e instanceof Error ? e.message : String(e))
      setTransition(null)
    },
  });
  const restartMut = useMutation({
    mutationFn: () => restart(),
    onMutate: () => {
      setTransition("starting");
      transitionStart.current = Date.now();
      appendConsole("$ gc supervisor restart", "stopping + starting…");
    },
    onSuccess: (r) => {
      appendConsole("$ gc supervisor restart", r.output);
      if (!r.ok) appendConsole("! gc supervisor restart", `error: ${r.error ?? "unknown"}`);
      qc.invalidateQueries({ queryKey: ["gc", "health"] });
      qc.invalidateQueries({ queryKey: ["gc", "city-status"] });
    },
    onError: (e: unknown) => {
      appendConsole("! gc supervisor restart", e instanceof Error ? e.message : String(e));
      setTransition(null);
    },
  });

  const phaseLabel =
    phase === "up-running"
      ? "operational"
      : phase === "up-stopped"
        ? "supervisor up · city stopped"
        : phase === "starting"
          ? "starting…"
          : phase === "stopping"
            ? "stopping…"
            : "down";

  // Button enablement + action kind. The button labels stay constant
// ("start", "restart", "stop"); a `data-action-kind` attribute exposes
// what the click will actually do so tests (and tooltip UIs) can
// introspect the current target.
const startActionKind =
  phase === "down"
    ? "supervisor-start"
    : phase === "up-stopped"
      ? "city-start"
      : null;
const stopActionKind =
  phase === "up-running"
    ? "city-stop"
    : phase === "up-stopped"
      ? "supervisor-stop"
      : null;
const restartActionKind =
  phase === "up-running" || phase === "up-stopped" ? "supervisor-restart" : null;

const canStart = startActionKind !== null;
const canStop = stopActionKind !== null;
const canRestart = restartActionKind !== null;
const busy = !!transition;

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
              onClick={() => { captureStartIntent(); startMut.mutate() }}
              disabled={!canStart || busy}
              aria-label={startActionKind === "supervisor-start" ? "start supervisor" : "start city"}
              title={startActionKind === "supervisor-start" ? "start the gc supervisor daemon" : "start the city"}
              data-testid="supervisor-start"
              data-action-kind={startActionKind ?? "unavailable"}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:bg-muted disabled:opacity-40"
            >
              start
            </button>
            <button
              onClick={() => restartMut.mutate()}
              disabled={!canRestart || busy}
              aria-label="restart supervisor"
              title="restart the gc supervisor daemon"
              data-testid="supervisor-restart"
              data-action-kind={restartActionKind ?? "unavailable"}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] hover:bg-muted disabled:opacity-40"
            >
              restart
            </button>
            <button
              onClick={() => { captureStopIntent(); stopMut.mutate() }}
              disabled={!canStop || busy}
              aria-label={stopActionKind === "supervisor-stop" ? "stop supervisor" : "stop city"}
              title={stopActionKind === "supervisor-stop" ? "stop the gc supervisor daemon" : "stop the city"}
              data-testid="supervisor-stop"
              data-action-kind={stopActionKind ?? "unavailable"}
              className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              stop
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-px bg-border font-mono text-[11px]">
          <div className="bg-background px-4 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              agents
            </div>
            <div className="text-foreground" data-testid="stat-agents">
              {city?.reachable ? `${city.agents.running}/${city.agents.total}` : "—"}
            </div>
          </div>
          <div className="bg-background px-4 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              sessions
            </div>
            <div className="text-foreground" data-testid="stat-sessions">
              {city?.reachable ? `${city.sessions.running}/${city.sessions.total}` : "—"}
            </div>
          </div>
          <div className="bg-background px-4 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              mail
            </div>
            <div className="text-foreground" data-testid="stat-mail">
              {city?.reachable
                ? city.mail.unread > 0
                  ? `${city.mail.unread} unread / ${city.mail.total}`
                  : `${city.mail.total}`
                : "—"}
            </div>
          </div>
          <div className="bg-background px-4 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              beads
            </div>
            <div className="text-foreground" data-testid="stat-beads">
              {city?.reachable ? `${city.work.open} open` : "—"}
            </div>
          </div>
        </div>

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
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                >
                  clear
                </button>
              )}
            </div>
          </div>
          <pre
            className="max-h-32 overflow-auto px-4 pb-2 font-mono text-[11px] leading-relaxed text-foreground"
            data-testid="action-console-text"
          >
            {console_ || "(no actions yet)"}
          </pre>
        </div>

        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              supervisor log
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                {log?.source ?? ""}
              </span>
              {log?.output && (
                <button
                  onClick={() => copyText(log.output, setCopiedLog)}
                  title="copy supervisor log to clipboard"
                  data-testid="supervisor-log-copy"
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {copiedLog ? "copied!" : "copy"}
                </button>
              )}
            </div>
          </div>
          <pre
            className="max-h-56 overflow-auto px-4 pb-3 font-mono text-[11px] leading-relaxed text-muted-foreground"
            data-testid="supervisor-log-text"
          >
            {log?.output || "(loading…)"}
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
    <nav className="flex w-48 shrink-0 flex-col border-r border-border">
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
              <PaletteItem onSelect={() => go("/packs")}>packs</PaletteItem>
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
