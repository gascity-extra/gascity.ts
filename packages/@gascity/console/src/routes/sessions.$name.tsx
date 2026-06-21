import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SessionTerminal } from "@/components/SessionTerminal";

export const Route = createFileRoute("/sessions/$name")({
  head: ({ params }) => ({
    meta: [{ title: `${params.name} — gc console` }],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { name } = Route.useParams();
  return (
    <AppShell>
      <SessionTerminal name={name} />
    </AppShell>
  );
}
