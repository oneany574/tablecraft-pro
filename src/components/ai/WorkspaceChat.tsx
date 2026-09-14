import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, MessageSquarePlus, PanelLeft, Trash2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ThemeControl } from "@/components/ThemeControl";
import { createThreadId, ensureThread, readThreads, saveThread, writeThreads, type AiThread } from "@/lib/ai-threads";
import { useDatabase } from "@/lib/notion/store";
import { AtlasMark } from "./AtlasMark";

function threadSnapshot() {
  return readThreads().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function WorkspaceChat({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const api = useDatabase();
  const initial = useMemo(() => ensureThread(threadId), [threadId]);
  const [threads, setThreads] = useState<AiThread[]>(threadSnapshot);
  const [input, setInput] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { workspaceContext: api.state } }),
    [api.state],
  );
  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initial.messages,
    transport,
  });

  useEffect(() => {
    saveThread(threadId, messages);
    setThreads(threadSnapshot());
  }, [messages, status, threadId]);

  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status, threadId]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    setInput("");
    void sendMessage({ text });
  };

  const newThread = () => {
    const id = createThreadId();
    ensureThread(id);
    void navigate({ to: "/ai/$threadId", params: { threadId: id } });
  };

  const removeThread = (id: string) => {
    const remaining = readThreads().filter((thread) => thread.id !== id);
    writeThreads(remaining);
    if (id === threadId) {
      const next = remaining[0]?.id ?? createThreadId();
      if (!remaining[0]) ensureThread(next);
      void navigate({ to: "/ai/$threadId", params: { threadId: next } });
    } else setThreads(threadSnapshot());
  };

  return (
    <main className="flex h-screen bg-nt-surface text-nt-text">
      <aside className={`${sidebar ? "flex" : "hidden"} w-72 shrink-0 flex-col border-r border-nt-line bg-ai-sidebar md:flex`}>
        <div className="flex h-14 items-center gap-2 border-b border-nt-line px-3">
          <AtlasMark />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Atlas AI</p>
            <p className="text-xs text-nt-muted">Project copilot</p>
          </div>
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={newThread} title="New conversation">
            <MessageSquarePlus />
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {threads.map((thread) => (
            <div key={thread.id} className="group flex items-center gap-1">
              <Link
                to="/ai/$threadId"
                params={{ threadId: thread.id }}
                className={`min-w-0 flex-1 truncate rounded-md px-3 py-2 text-sm hover:bg-nt-hover ${thread.id === threadId ? "bg-nt-active font-medium" : "text-nt-muted"}`}
              >
                {thread.title}
              </Link>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => removeThread(thread.id)} title="Delete conversation">
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t border-nt-line p-3">
          <p className="text-xs text-nt-muted">Chats are saved in this browser.</p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-nt-line px-3 sm:px-5">
          <Button variant="ghost" size="icon-sm" onClick={() => setSidebar((value) => !value)} title="Toggle conversations">
            <PanelLeft />
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft /> Tasks</Link>
          </Button>
          <span className="ml-1 truncate text-sm font-medium">{initial.title}</span>
          <div className="ml-auto"><ThemeControl /></div>
        </header>

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-5 py-8">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<AtlasMark className="size-12" />}
                title="Ask about your workspace"
                description="Review priorities, find risks, plan work, or draft task updates."
              >
                <AtlasMark className="size-12" />
                <h1 className="mt-2 text-xl font-semibold">What should we work on?</h1>
                <div className="mt-3 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {["Summarize project progress", "What is overdue?", "Plan my next three priorities", "Draft a new launch task"].map((prompt) => (
                    <Button key={prompt} variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => void sendMessage({ text: prompt })}>
                      {prompt}
                    </Button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : null}
            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : null,
                  )}
                </MessageContent>
              </Message>
            ))}
            {status === "submitted" ? <Shimmer className="text-sm">Thinking through your workspace…</Shimmer> : null}
            {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error.message}</p> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="mx-auto w-full max-w-3xl px-4 pb-5">
          <PromptInput onSubmit={submit} className="bg-nt-surface">
            <PromptInputTextarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Atlas about your tasks…" />
            <PromptInputFooter className="justify-between">
              <span className="px-1 text-xs text-nt-muted">Workspace context included</span>
              <PromptInputSubmit status={status} disabled={!input.trim()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </section>
    </main>
  );
}