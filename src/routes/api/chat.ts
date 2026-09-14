import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableResponsesProvider, withRunId } from "@/lib/ai-gateway.server";

type ChatBody = {
  messages?: unknown;
  workspaceContext?: unknown;
  taskMode?: string;
};

function contextText(value: unknown) {
  if (!value) return "No workspace data was supplied.";
  const text = JSON.stringify(value);
  return text.length > 24_000 ? `${text.slice(0, 24_000)}…` : text;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ChatBody;
          if (!Array.isArray(body.messages)) {
            return Response.json({ error: "Messages are required." }, { status: 400 });
          }
          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) {
            return Response.json(
              { error: "AI is not configured for this workspace." },
              { status: 500 },
            );
          }

          const initialRunId = request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
          const gateway = createLovableResponsesProvider(apiKey, initialRunId);
          const taskInstruction = body.taskMode
            ? `The user selected the task action "${body.taskMode}". Return a concise, practical result that can be pasted into the task notes. For suggested fields, clearly label each recommended field and explain briefly.`
            : "Act as a project copilot. Answer questions about the workspace and help the user create, update, organize, and find tasks. When asked to change tasks, provide a short, explicit proposed change list and ask the user to make or confirm those edits in the workspace.";
          const result = streamText({
            model: gateway.provider.responses("openai/gpt-6-astra"),
            system: `You are Atlas, the embedded project workspace assistant. ${taskInstruction}\n\nCurrent workspace data:\n${contextText(body.workspaceContext)}`,
            messages: await convertToModelMessages(body.messages as UIMessage[]),
            providerOptions: {
              openai: {
                forceReasoning: true,
                reasoningEffort: "medium",
                reasoningSummary: "auto",
                store: false,
                include: ["reasoning.encrypted_content"],
              },
            },
          });

          return withRunId(
            result.toUIMessageStreamResponse({
              originalMessages: body.messages as UIMessage[],
              sendReasoning: true,
            }),
            gateway,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "AI request failed.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});