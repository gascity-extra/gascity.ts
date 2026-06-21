import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SessionsList } from "@/components/SessionsList";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sessions — gc console" },
      { name: "description", content: "Live Gas City agent sessions." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <SessionsList />
    </AppShell>
  );
}
