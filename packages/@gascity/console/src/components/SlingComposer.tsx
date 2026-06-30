import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import { gcListAgents, gcListCities, gcSling } from "@/lib/gc.functions";

export function SlingComposer({ onDone }: Readonly<{ onDone?: () => void }>) {
  const listCities = useServerFn(gcListCities);
  const listAgents = useServerFn(gcListAgents);
  const sling = useServerFn(gcSling);
  const qc = useQueryClient();

  const { data: cities } = useQuery({
    queryKey: ["gc", "cities"],
    queryFn: () => listCities(),
  });
  const [city, setCity] = useState<string>("");
  useEffect(() => {
    if (!city && cities && cities.length) { // NOSONAR: explicit check is clearer here
      const active = cities.find((c) => c.active) ?? cities[0];
      setCity(active.name);
    }
  }, [cities, city]);

  const { data: agents } = useQuery({
    queryKey: ["gc", "agents", city],
    queryFn: () => listAgents({ data: { city }}),
    enabled: !!city,
  });

  const [agent, setAgent] = useState("");
  const [text, setText] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textRef.current?.focus();
  }, []);

  const slingMut = useMutation({
    mutationFn: (payload: { agent: string; text: string }) =>
      sling({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gc", "sessions"] });
      qc.invalidateQueries({ queryKey: ["gc", "beads"] });
    },
  });

  function submit() {
    if (!agent || !text.trim()) return;
    slingMut.mutate(
      { agent, text: text.trim() },
      {
        onSuccess: (res) => {
          if (res.ok) {
            setText("");
            onDone?.();
          }
        },
      },
    );
  }

  function onKey(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") onDone?.();
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 font-mono text-xs">
        <span className="text-muted-foreground">city</span>
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
          {(!cities || cities.length === 0) && <option value="">(none)</option>}
        </select>
        <span className="text-muted-foreground">→</span>
        <span className="text-muted-foreground">agent</span>
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="bg-transparent text-foreground outline-none"
        >
          <option value="">choose…</option>
          {(agents ?? []).map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        rows={6}
        placeholder="describe the task — gc sling <agent> &quot;…&quot;"
        className="resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <div className="font-mono text-[11px] text-muted-foreground">
          {(() => {
            if (slingMut.isPending) return "slinging…"
            if (slingMut.data?.ok === false) return <span className="text-destructive">{slingMut.data?.error || "sling failed"}</span>
            if (slingMut.data?.ok) return <span className="text-foreground">slung. bead {slingMut.data?.bead_id ?? "?"}</span>
            return <span>⌘↵ submit · esc cancel</span>
          })()}
        </div>
        <button
          onClick={submit}
          disabled={!agent || !text.trim() || slingMut.isPending}
          className="rounded border border-foreground bg-foreground px-3 py-1 font-mono text-xs text-background disabled:opacity-40"
        >
          sling
        </button>
      </div>
    </div>
  );
}
