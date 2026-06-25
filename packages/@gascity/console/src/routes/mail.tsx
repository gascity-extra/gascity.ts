import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import {
  gcListAgents,
  gcListCities,
  gcMailInbox,
  gcMailSend,
} from "@/lib/gc.functions";

export const Route = createFileRoute("/mail")({
  head: () => ({ meta: [{ title: "Mail — gc console" }] }),
  component: MailPage,
});

function MailPage() {
  const listCities = useServerFn(gcListCities);
  const listAgents = useServerFn(gcListAgents);
  const inbox = useServerFn(gcMailInbox);
  const send = useServerFn(gcMailSend);
  const qc = useQueryClient();

  const { data: cities } = useQuery({
    queryKey: ["gc", "cities"],
    queryFn: () => listCities(),
  });
  const [city, setCity] = useState("");
  useEffect(() => {
    if (!city && cities?.length) {
      setCity((cities.find((c) => c.active) ?? cities[0]).name);
    }
  }, [cities, city]);

  const { data: agents } = useQuery({
    queryKey: ["gc", "agents", city],
    queryFn: () => listAgents({ data: { city }}),
    enabled: !!city,
  });

  const [agent, setAgent] = useState("");
  useEffect(() => {
    if (!agent && agents?.length) setAgent(agents[0].name);
  }, [agents, agent]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["gc", "mail", agent],
    queryFn: () => inbox({ data: { agent }}),
    enabled: !!agent,
    refetchInterval: 5000,
  });

  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const sendMut = useMutation({
    mutationFn: (p: { to: string; subject?: string; body: string }) =>
      send({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gc", "mail"] });
      setSubject("");
      setBody("");
      setComposeOpen(false);
    },
  });

  function submit() {
    if (!agent || !body.trim()) return;
    sendMut.mutate({
      to: agent,
      subject: subject.trim() || undefined,
      body: body.trim(),
    });
  }

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <h1 className="font-mono text-sm text-foreground">mail</h1>
            <span>·</span>
            <span>city</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-foreground outline-none"
            >
              {(cities ?? []).map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <span>→ agent</span>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="bg-transparent text-foreground outline-none"
            >
              {(agents ?? []).map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setComposeOpen((v) => !v)}
            className="rounded border border-foreground bg-foreground px-2 py-0.5 font-mono text-[11px] text-background"
          >
            {composeOpen ? "close" : "compose"}
          </button>
        </div>

        {composeOpen && (
          <div className="border-b border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-6 py-2 font-mono text-[11px] text-muted-foreground">
              <span>to</span>
              <span className="text-foreground">{agent || "—"}</span>
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="subject (optional)"
              className="w-full border-b border-border bg-transparent px-6 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
              rows={5}
              placeholder="message body — ⌘↵ to send"
              className="w-full resize-none bg-transparent px-6 py-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between border-t border-border px-6 py-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                {sendMut.isPending
                  ? "sending…"
                  : sendMut.data?.error
                    ? <span className="text-destructive">{sendMut.data.error}</span>
                    : sendMut.data?.ok
                      ? `sent ${sendMut.data.id ?? ""}`
                      : "gc mail send"}
              </span>
              <button
                onClick={submit}
                disabled={!body.trim() || sendMut.isPending}
                className="rounded border border-foreground bg-foreground px-3 py-1 font-mono text-xs text-background disabled:opacity-40"
              >
                send
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="px-6 py-4 font-mono text-xs text-muted-foreground">
              loading…
            </div>
          )}
          {!isLoading && !messages?.length && (
            <div className="px-6 py-8 font-mono text-xs text-muted-foreground">
              inbox empty for <code>{agent || "—"}</code>. nudge or wait for a
              hook to deliver mail.
            </div>
          )}
          <ul>
            {(messages ?? []).map((m) => (
              <li
                key={m.id}
                className="border-b border-border px-6 py-3 hover:bg-muted/40"
              >
                <div className="flex items-baseline gap-3 font-mono text-[11px] text-muted-foreground">
                  <code>{m.id}</code>
                  <span>from {m.from}</span>
                  {m.unread && (
                    <span className="text-foreground">· unread</span>
                  )}
                </div>
                {m.subject && (
                  <div className="mt-1 font-mono text-sm text-foreground">
                    {m.subject}
                  </div>
                )}
                <div className="mt-1 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground">
                  {m.body}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
