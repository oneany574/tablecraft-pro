import type { UIMessage } from "ai";

export interface AiThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: UIMessage[];
}

const THREADS_KEY = "notion-ai-threads-v1";

export const createThreadId = () => Math.random().toString(36).slice(2, 12);

export function readThreads(): AiThread[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(THREADS_KEY) ?? "[]") as AiThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeThreads(threads: AiThread[]) {
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

export function ensureThread(id: string): AiThread {
  const threads = readThreads();
  const found = threads.find((thread) => thread.id === id);
  if (found) return found;
  const thread: AiThread = {
    id,
    title: "New conversation",
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  writeThreads([thread, ...threads]);
  return thread;
}

export function saveThread(id: string, messages: UIMessage[]) {
  const threads = readThreads();
  const firstUserText = messages
    .find((message) => message.role === "user")
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
  const next: AiThread = {
    id,
    title: firstUserText ? firstUserText.slice(0, 42) : "New conversation",
    updatedAt: new Date().toISOString(),
    messages,
  };
  writeThreads([next, ...threads.filter((thread) => thread.id !== id)]);
}