import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DatabaseApi } from "@/lib/notion/store";
import type { Row } from "@/lib/notion/types";
import { Cell } from "./Cell";
import { MenuItem, Pop } from "./ui";
import { TypeIcon } from "./icons";

const EMOJIS = ["📄", "📌", "🚀", "🐛", "💡", "🎨", "📊", "🔧", "📝", "⚡", "🔥", "✅", "🌘", "💰", "♿", "🎙️"];
const COVERS = ["cover-1", "cover-2", "cover-3", "cover-4"];

export function RowDrawer({
  api,
  rows,
  rowId,
  onClose,
  onNavigate,
}: {
  api: DatabaseApi;
  rows: Row[];
  rowId: string;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const index = rows.findIndex((r) => r.id === rowId);
  const row = rows[index];
  const [iconAnchor, setIconAnchor] = useState<HTMLElement | null>(null);
  const [coverAnchor, setCoverAnchor] = useState<HTMLElement | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!row) return null;
  const titleCol = api.state.columns[0]!;
  const prev = rows[index - 1];
  const next = rows[index + 1];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-nt-text/10" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-nt-line bg-nt-surface shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Breadcrumb bar */}
        <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-nt-line bg-nt-surface px-3 py-2 text-[13px] text-nt-muted">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && onNavigate(prev.id)}
            className="rounded p-1 hover:bg-nt-hover disabled:opacity-30"
            title="Previous row"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && onNavigate(next.id)}
            className="rounded p-1 hover:bg-nt-hover disabled:opacity-30"
            title="Next row"
          >
            <ChevronRight className="size-4" />
          </button>
          <span className="ml-1 truncate">
            {api.state.title} / {String(row.cells[titleCol.id] ?? "Untitled")}
          </span>
          <span className="ml-auto text-xs">
            {index + 1} of {rows.length}
          </span>
          <button
            type="button"
            onClick={() => {
              api.deleteRow(row.id);
              onClose();
            }}
            className="rounded p-1 hover:bg-nt-hover hover:text-tag-red-fg"
            title="Delete row"
          >
            <Trash2 className="size-4" />
          </button>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-nt-hover">
            <X className="size-4" />
          </button>
        </div>

        {/* Cover */}
        <div className={cn("group/c relative h-28 w-full", row.cover ?? "bg-nt-hover")}>
          <button
            type="button"
            onClick={(e) => setCoverAnchor(e.currentTarget)}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md border border-nt-line bg-nt-surface px-2 py-1 text-xs text-nt-muted opacity-0 transition group-hover/c:opacity-100"
          >
            <ImageIcon className="size-3.5" /> Change cover
          </button>
        </div>

        <div className="px-8 pb-12">
          <button
            type="button"
            onClick={(e) => setIconAnchor(e.currentTarget)}
            className="-mt-7 mb-2 flex size-14 items-center justify-center rounded-lg bg-nt-surface text-4xl hover:bg-nt-hover"
          >
            {row.icon}
          </button>

          <input
            value={String(row.cells[titleCol.id] ?? "")}
            onChange={(e) => api.setCell(row.id, titleCol.id, e.target.value)}
            placeholder="Untitled"
            className="w-full bg-transparent text-3xl font-bold text-nt-text outline-none placeholder:text-nt-faint"
          />

          <div className="mt-5 space-y-0.5">
            {api.state.columns.slice(1).map((col) => (
              <div key={col.id} className="flex items-start gap-2">
                <div className="flex w-40 shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-nt-muted hover:bg-nt-hover">
                  <TypeIcon type={col.type} />
                  <span className="truncate">{col.name}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Cell row={row} col={col} api={api} variant="drawer" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-nt-line pt-4">
            <h3 className="mb-1 text-sm font-semibold text-nt-text">Notes</h3>
            <textarea
              value={row.notes ?? ""}
              onChange={(e) => api.patchRow(row.id, { notes: e.target.value })}
              placeholder="Write something, or drop in your meeting notes…"
              className="min-h-28 w-full resize-y rounded-md p-2 text-[14px] leading-6 text-nt-text outline-none placeholder:text-nt-faint hover:bg-nt-hover focus:bg-nt-hover"
            />
          </div>

          <div className="mt-4 border-t border-nt-line pt-4">
            <h3 className="mb-2 text-sm font-semibold text-nt-text">Activity</h3>
            <ul className="space-y-3">
              {row.comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-tag-blue-bg text-[11px] text-tag-blue-fg">
                    {c.author.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-nt-text">
                      {c.author}{" "}
                      <span className="font-normal text-nt-faint">
                        {new Date(c.at).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="text-[13px] text-nt-text">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                api.addComment(row.id, comment.trim());
                setComment("");
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 rounded-full border border-nt-line px-3 py-1.5 text-[13px] outline-none focus:border-nt-blue"
              />
              <button
                type="submit"
                className="rounded-full bg-nt-blue px-3 text-[13px] font-medium text-nt-surface"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </aside>

      {iconAnchor ? (
        <Pop anchor={iconAnchor} onClose={() => setIconAnchor(null)} width={240}>
          <div className="grid grid-cols-8 gap-1 p-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  api.patchRow(row.id, { icon: e });
                  setIconAnchor(null);
                }}
                className="rounded p-1 text-lg hover:bg-nt-hover"
              >
                {e}
              </button>
            ))}
          </div>
        </Pop>
      ) : null}

      {coverAnchor ? (
        <Pop anchor={coverAnchor} onClose={() => setCoverAnchor(null)} width={220} align="end">
          <div className="grid grid-cols-2 gap-2 p-2">
            {COVERS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  api.patchRow(row.id, { cover: c });
                  setCoverAnchor(null);
                }}
                className={cn("h-10 rounded-md border border-nt-line", c)}
              />
            ))}
          </div>
          <MenuItem
            onClick={() => {
              api.patchRow(row.id, { cover: null });
              setCoverAnchor(null);
            }}
          >
            Remove cover
          </MenuItem>
        </Pop>
      ) : null}
    </div>
  );
}
