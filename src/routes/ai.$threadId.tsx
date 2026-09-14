import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceChat } from "@/components/ai/WorkspaceChat";

export const Route = createFileRoute("/ai/$threadId")({
  head: () => ({
    meta: [
      { title: "Atlas AI — Project Tasks" },
      { name: "description", content: "An AI project copilot for planning and organizing your task workspace." },
      { property: "og:title", content: "Atlas AI — Project Tasks" },
      { property: "og:description", content: "Ask questions, find priorities, and plan changes across your task workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiThreadPage,
});

function AiThreadPage() {
  const { threadId } = Route.useParams();
  return <WorkspaceChat key={threadId} threadId={threadId} />;
}