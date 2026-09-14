import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Check, FileText, ListTree, Tags, Wand2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import type { DatabaseApi } from "@/lib/notion/store";
import type { Row } from "@/lib/notion/types";
import { AtlasMark } from "./AtlasMark";

const actions = [
  { id: "Summarize", icon: FileText },
  { id: "Draft details", icon: Wand2 },
  { id: "Break down task", icon: ListTree },
  { id: "Suggest fields", icon: Tags },
] as const;

export function TaskAi({ api, row }: { api: DatabaseApi; row: Row }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, setMessages, status, error } = useChat({
    id: `task-${row.id}`,
    transport,
  });
  const result = [...messages].reverse().find((message) => message.role === "assistant");
  const resultText = result?.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n") ?? "";

  const run = (nextAction: string) => {
    setAction(nextAction);
    setMessages([]);
    void sendMessage(
      { text: `${nextAction} for this task.` },
      { body: { workspaceContext: { task: row, columns: api.state.columns, people: api.state.people }, taskMode: nextAction } },
    );
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <AtlasMark className="size-5 rounded-sm" /> Ask AI
      </Button>
    );
  }

  return (
    <section className="mt-4 border-y border-nt-line bg-ai-panel py-4">
      <div className="mb-3 flex items-center gap-2">
        <AtlasMark className="size-7" />
        <h3 className="text-sm font-semibold">Task AI</h3>
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={() => setOpen(false)} title="Close task AI"><X /></Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ id, icon: Icon }) => (
          <Button key={id} variant="outline" size="sm" className="justify-start" disabled={status !== "ready"} onClick={() => run(id)}>
            <Icon /> {id}
          </Button>
        ))}
      </div>
      {status === "submitted" || status === "streaming" ? (
        <div className="mt-4 text-sm"><Shimmer>{`${action ?? "AI"}…`}</Shimmer></div>
      ) : null}
      {resultText ? (
        <div className="mt-4 rounded-md border border-nt-line bg-nt-surface p-3">
          <MessageResponse className="text-sm">{resultText}</MessageResponse>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMessages([])}>Discard</Button>
            <Button size="sm" onClick={() => { api.patchRow(row.id, { notes: [row.notes, resultText].filter(Boolean).join("\n\n") }); setMessages([]); }}>
              <Check /> Add to notes
            </Button>
          </div>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error.message}</p> : null}
    </section>
  );
}