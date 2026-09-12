import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleRows, type DatabaseApi } from "@/lib/notion/store";
import { CellPreview } from "./Cell";
import { Tag } from "./ui";

export function BoardView({
  api,
  onOpenRow,
}: {
  api: DatabaseApi;
  onOpenRow: (id: string) => void;
}) {
  const { state, view } = api;
  const groupCol =
    state.columns.find((c) => c.id === view.groupBy) ??
    state.columns.find((c) => c.type === "status" || c.type === "select");
  const rows = visibleRows(state, view);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overGroup, setOverGroup] = useState<string | null>(null);

  if (!groupCol) {
    return <p className="p-6 text-sm text-nt-muted">Add a select or status property to group by.</p>;
  }

  const groups = [
    ...(groupCol.options ?? []).map((o) => ({ id: o.id, name: o.name, color: o.color })),
    { id: "", name: "No " + groupCol.name.toLowerCase(), color: "default" as const },
  ];

  const titleCol = state.columns[0]!;

  return (
    <div className="flex gap-3 overflow-x-auto pb-6 pt-3">
      {groups.map((g) => {
        const items = rows.filter((r) => (r.cells[groupCol.id] ?? "") === g.id);
        return (
          <div
            key={g.id || "none"}
            onDragOver={(e) => {
              e.preventDefault();
              setOverGroup(g.id);
            }}
            onDrop={() => {
              if (dragId) api.setCell(dragId, groupCol.id, g.id);
              setDragId(null);
              setOverGroup(null);
            }}
            className={cn(
              "flex w-64 shrink-0 flex-col gap-2 rounded-lg p-2 transition-colors",
              overGroup === g.id ? "bg-nt-blue-soft/60" : "bg-nt-hover",
            )}
          >
            <div className="flex items-center gap-2 px-1">
              <Tag color={g.color}>{g.name}</Tag>
              <span className="text-xs text-nt-muted">{items.length}</span>
            </div>
            {items.map((r) => (
              <button
                key={r.id}
                type="button"
                draggable
                onDragStart={() => setDragId(r.id)}
                onDragEnd={() => setDragId(null)}
                onClick={() => onOpenRow(r.id)}
                className={cn(
                  "rounded-lg border border-nt-line bg-nt-surface p-2 text-left shadow-sm transition hover:shadow-md",
                  dragId === r.id && "opacity-40",
                )}
              >
                <div className="flex items-start gap-1.5">
                  <span>{r.icon}</span>
                  <span className="text-[13px] font-medium text-nt-text">
                    {String(r.cells[titleCol.id] ?? "Untitled")}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {state.columns
                    .filter((c) => !c.hidden && ["multi_select", "person"].includes(c.type))
                    .map((c) => (
                      <CellPreview key={c.id} row={r} col={c} api={api} />
                    ))}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => api.addRow({ [groupCol.id]: g.id })}
              className="flex items-center gap-1 rounded-md px-1 py-1 text-[13px] text-nt-muted hover:bg-nt-active"
            >
              <Plus className="size-3.5" /> New
            </button>
          </div>
        );
      })}
    </div>
  );
}
