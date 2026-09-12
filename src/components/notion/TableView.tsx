import { useRef, useState } from "react";
import { ChevronDown, Copy, GripVertical, Maximize2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleRows, type DatabaseApi } from "@/lib/notion/store";
import type { Column } from "@/lib/notion/types";
import { Cell } from "./Cell";
import { ColumnMenu } from "./ColumnMenu";
import { MenuItem, MenuSep, Pop } from "./ui";
import { TypeIcon } from "./icons";

const HEIGHT: Record<string, string> = {
  short: "h-9",
  medium: "h-16",
  tall: "h-24",
};

export function TableView({
  api,
  onOpenRow,
}: {
  api: DatabaseApi;
  onOpenRow: (id: string) => void;
}) {
  const { state, view } = api;
  const cols = state.columns.filter((c) => !c.hidden);
  const rows = visibleRows(state, view);

  const gridRef = useRef<HTMLDivElement>(null);
  const [menuCol, setMenuCol] = useState<{ col: Column; el: HTMLElement } | null>(null);
  const [rowMenu, setRowMenu] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);

  const [dragCol, setDragCol] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [dragRow, setDragRow] = useState<string | null>(null);
  const [overRow, setOverRow] = useState<string | null>(null);

  const focusCell = (r: number, c: number) => {
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`);
    el?.focus();
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!target) return;
    const [r = 0, c = 0] = (target.dataset["cell"] ?? "0-0").split("-").map(Number);
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!keys.includes(e.key)) {
      if (e.key === "Enter") {
        e.preventDefault();
        const inner = target.querySelector<HTMLElement>("input, [role='button'], [role='checkbox']");
        inner ? inner.click() : target.click();
        (target.querySelector("input") as HTMLInputElement | null)?.focus();
      }
      return;
    }
    if (document.activeElement?.tagName === "INPUT") return;
    e.preventDefault();
    if (e.key === "ArrowUp") focusCell(Math.max(0, r - 1), c);
    if (e.key === "ArrowDown") focusCell(Math.min(rows.length - 1, r + 1), c);
    if (e.key === "ArrowLeft") focusCell(r, Math.max(0, c - 1));
    if (e.key === "ArrowRight") focusCell(r, Math.min(cols.length - 1, c + 1));
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max" ref={gridRef} onKeyDown={onGridKeyDown}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex border-b border-nt-line bg-nt-surface">
          <div className="w-16 shrink-0" />
          {cols.map((col) => (
            <div
              key={col.id}
              draggable
              onDragStart={() => setDragCol(col.id)}
              onDragEnd={() => {
                setDragCol(null);
                setOverCol(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragCol && dragCol !== col.id) setOverCol(col.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragCol) api.moveColumn(dragCol, col.id);
                setDragCol(null);
                setOverCol(null);
              }}
              style={{ width: col.width }}
              className={cn(
                "group/h relative flex h-9 shrink-0 items-center border-r border-nt-line",
                overCol === col.id && "bg-nt-blue-soft",
                dragCol === col.id && "opacity-50",
              )}
            >
              {overCol === col.id ? (
                <span className="absolute inset-y-0 left-0 w-0.5 bg-nt-blue" />
              ) : null}
              <button
                type="button"
                onClick={(e) => setMenuCol({ col, el: e.currentTarget })}
                className="flex h-full w-full items-center gap-1.5 px-2 text-[13px] text-nt-muted transition-colors hover:bg-nt-hover"
              >
                <TypeIcon type={col.type} />
                <span className="flex-1 truncate text-left">{col.name}</span>
                <ChevronDown className="size-3 opacity-0 group-hover/h:opacity-100" />
              </button>
              <span
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startW = col.width;
                  const move = (ev: MouseEvent) =>
                    api.patchColumn(col.id, {
                      width: Math.max(80, startW + ev.clientX - startX),
                    });
                  const up = () => {
                    window.removeEventListener("mousemove", move);
                    window.removeEventListener("mouseup", up);
                  };
                  window.addEventListener("mousemove", move);
                  window.addEventListener("mouseup", up);
                }}
                className="absolute -right-0.5 top-0 h-full w-1 cursor-col-resize hover:bg-nt-blue"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={(e) => setAddAnchor(e.currentTarget)}
            className="flex h-9 w-12 items-center justify-center text-nt-muted transition-colors hover:bg-nt-hover"
            title="Add a property"
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* Rows */}
        {rows.map((row, rIdx) => (
          <div
            key={row.id}
            onDragOver={(e) => {
              if (!dragRow) return;
              e.preventDefault();
              if (dragRow !== row.id) setOverRow(row.id);
            }}
            onDrop={(e) => {
              if (!dragRow) return;
              e.preventDefault();
              api.moveRow(dragRow, row.id);
              setDragRow(null);
              setOverRow(null);
            }}
            draggable={dragRow === row.id}
            onDragEnd={() => {
              setDragRow(null);
              setOverRow(null);
            }}
            className={cn(
              "group/r relative flex border-b border-nt-line transition-colors hover:bg-nt-hover/60",
              HEIGHT[view.rowHeight],
              dragRow === row.id && "opacity-40",
            )}
          >
            {overRow === row.id ? (
              <span className="absolute inset-x-0 -top-px z-10 h-0.5 bg-nt-blue" />
            ) : null}
            <div className="flex w-16 shrink-0 items-center justify-end gap-0.5 pr-1">
              <button
                type="button"
                title="Drag to reorder"
                onMouseDown={() => setDragRow(row.id)}
                className="cursor-grab text-nt-faint opacity-0 transition hover:text-nt-muted group-hover/r:opacity-100"
              >
                <GripVertical className="size-4" />
              </button>
              <button
                type="button"
                title="Row actions"
                onClick={(e) => setRowMenu({ id: row.id, el: e.currentTarget })}
                className="text-nt-faint opacity-0 transition hover:text-nt-muted group-hover/r:opacity-100"
              >
                <Plus className="size-4 rotate-45" />
              </button>
            </div>
            {cols.map((col, cIdx) => (
              <div
                key={col.id}
                data-cell={`${rIdx}-${cIdx}`}
                tabIndex={0}
                style={{ width: col.width }}
                className="relative shrink-0 border-r border-nt-line outline-none focus:ring-2 focus:ring-nt-blue focus:ring-inset"
              >
                <Cell row={row} col={col} api={api} />
                {cIdx === 0 ? (
                  <button
                    type="button"
                    onClick={() => onOpenRow(row.id)}
                    className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-nt-line bg-nt-surface px-1.5 py-0.5 text-[11px] text-nt-muted shadow-sm group-hover/r:flex"
                  >
                    <Maximize2 className="size-3" /> Open
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ))}

        {/* New row */}
        <button
          type="button"
          onClick={() => api.addRow()}
          className="flex h-9 w-full items-center gap-1.5 border-b border-nt-line pl-16 text-[13px] text-nt-faint transition-colors hover:bg-nt-hover hover:text-nt-muted"
        >
          <Plus className="size-3.5" /> New page
        </button>
        <div className="pl-16 pt-2 text-xs text-nt-muted">{rows.length} rows</div>
      </div>

      {menuCol ? (
        <Pop anchor={menuCol.el} onClose={() => setMenuCol(null)} width={280}>
          <ColumnMenu
            col={state.columns.find((c) => c.id === menuCol.col.id) ?? menuCol.col}
            api={api}
            onClose={() => setMenuCol(null)}
          />
        </Pop>
      ) : null}

      {rowMenu ? (
        <Pop anchor={rowMenu.el} onClose={() => setRowMenu(null)} width={220}>
          <MenuItem
            icon={<Maximize2 className="size-3.5" />}
            onClick={() => {
              onOpenRow(rowMenu.id);
              setRowMenu(null);
            }}
          >
            Open page
          </MenuItem>
          <MenuItem
            icon={<Copy className="size-3.5" />}
            onClick={() => {
              api.duplicateRow(rowMenu.id);
              setRowMenu(null);
            }}
          >
            Duplicate
          </MenuItem>
          <MenuSep />
          <MenuItem
            icon={<Trash2 className="size-3.5" />}
            danger
            onClick={() => {
              api.deleteRow(rowMenu.id);
              setRowMenu(null);
            }}
          >
            Delete
          </MenuItem>
        </Pop>
      ) : null}

      {addAnchor ? (
        <Pop anchor={addAnchor} onClose={() => setAddAnchor(null)} width={240} align="end">
          <div className="py-1">
            <p className="px-2 pb-1 text-xs font-medium text-nt-muted">New property</p>
            {(
              [
                "text",
                "number",
                "select",
                "multi_select",
                "status",
                "date",
                "person",
                "checkbox",
                "url",
                "files",
                "formula",
              ] as const
            ).map((t) => (
              <MenuItem
                key={t}
                icon={<TypeIcon type={t} />}
                onClick={() => {
                  api.addColumn(t);
                  setAddAnchor(null);
                }}
              >
                {t.replace("_", " ")}
              </MenuItem>
            ))}
          </div>
        </Pop>
      ) : null}
    </div>
  );
}
