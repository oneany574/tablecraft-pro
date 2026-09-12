import { useRef, useState } from "react";
import {
  ArrowDownUp,
  Eye,
  Filter,
  LayoutGrid,
  Plus,
  RotateCcw,
  Rows3,
  Search,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uid, type DatabaseApi } from "@/lib/notion/store";
import type { FilterOperator, RowHeight } from "@/lib/notion/types";
import { MenuItem, MenuLabel, MenuSep, Pop, ToolbarButton } from "./ui";
import { TypeIcon } from "./icons";

const OPERATORS: { id: FilterOperator; label: string }[] = [
  { id: "contains", label: "Contains" },
  { id: "not_contains", label: "Does not contain" },
  { id: "is", label: "Is" },
  { id: "is_not", label: "Is not" },
  { id: "is_empty", label: "Is empty" },
  { id: "is_not_empty", label: "Is not empty" },
];

export function Toolbar({ api }: { api: DatabaseApi }) {
  const { state, view } = api;
  const [open, setOpen] = useState<null | "filter" | "sort" | "height" | "hidden">(null);
  const [searching, setSearching] = useState(false);
  const filterRef = useRef<HTMLButtonElement>(null);
  const sortRef = useRef<HTMLButtonElement>(null);
  const heightRef = useRef<HTMLButtonElement>(null);
  const hiddenRef = useRef<HTMLButtonElement>(null);

  const hiddenCount = state.columns.filter((c) => c.hidden).length;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-nt-line pb-1">
      <div className="flex items-center gap-1">
        {state.views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => api.setActiveView(v.id)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] transition-colors",
              v.id === state.activeViewId
                ? "bg-nt-active font-medium text-nt-text"
                : "text-nt-muted hover:bg-nt-hover",
            )}
          >
            {v.type === "table" ? <Table2 className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
            {v.name}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {searching ? (
          <div className="flex h-7 items-center gap-1 rounded-md border border-nt-line px-2">
            <Search className="size-3.5 text-nt-muted" />
            <input
              autoFocus
              value={state.search}
              onChange={(e) => api.setSearch(e.target.value)}
              placeholder="Search…"
              className="w-40 bg-transparent text-[13px] outline-none placeholder:text-nt-faint"
            />
            <button
              type="button"
              onClick={() => {
                api.setSearch("");
                setSearching(false);
              }}
              className="text-nt-faint hover:text-nt-text"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <ToolbarButton title="Search" onClick={() => setSearching(true)}>
            <Search className="size-3.5" />
          </ToolbarButton>
        )}

        <ToolbarButton
          innerRef={filterRef}
          active={!!view.filters.length}
          onClick={() => setOpen(open === "filter" ? null : "filter")}
        >
          <Filter className="size-3.5" />
          Filter{view.filters.length ? ` ${view.filters.length}` : ""}
        </ToolbarButton>

        <ToolbarButton
          innerRef={sortRef}
          active={!!view.sorts.length}
          onClick={() => setOpen(open === "sort" ? null : "sort")}
        >
          <ArrowDownUp className="size-3.5" />
          Sort{view.sorts.length ? ` ${view.sorts.length}` : ""}
        </ToolbarButton>

        <ToolbarButton
          innerRef={hiddenRef}
          active={hiddenCount > 0}
          onClick={() => setOpen(open === "hidden" ? null : "hidden")}
        >
          <Eye className="size-3.5" />
          {hiddenCount ? `${hiddenCount} hidden` : "Properties"}
        </ToolbarButton>

        <ToolbarButton
          innerRef={heightRef}
          onClick={() => setOpen(open === "height" ? null : "height")}
          title="Row height"
        >
          <Rows3 className="size-3.5" />
        </ToolbarButton>

        <ToolbarButton title="Reset demo data" onClick={() => api.resetAll()}>
          <RotateCcw className="size-3.5" />
        </ToolbarButton>

        <button
          type="button"
          onClick={() => api.addRow()}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-nt-blue px-2.5 text-[13px] font-medium text-nt-surface transition-opacity hover:opacity-90"
        >
          <Plus className="size-3.5" /> New
        </button>
      </div>

      {open === "filter" ? (
        <Pop anchor={filterRef.current} onClose={() => setOpen(null)} width={420} align="end">
          <MenuLabel>Filters</MenuLabel>
          {view.filters.length === 0 ? (
            <p className="px-2 pb-1 text-xs text-nt-muted">No filters yet.</p>
          ) : null}
          {view.filters.map((f) => (
            <div key={f.id} className="flex items-center gap-1 px-1 py-1">
              <select
                value={f.columnId}
                onChange={(e) =>
                  api.patchView({
                    filters: view.filters.map((x) =>
                      x.id === f.id ? { ...x, columnId: e.target.value } : x,
                    ),
                  })
                }
                className="h-7 rounded-md border border-nt-line bg-nt-surface px-1 text-xs"
              >
                {api.state.columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={f.operator}
                onChange={(e) =>
                  api.patchView({
                    filters: view.filters.map((x) =>
                      x.id === f.id ? { ...x, operator: e.target.value as FilterOperator } : x,
                    ),
                  })
                }
                className="h-7 rounded-md border border-nt-line bg-nt-surface px-1 text-xs"
              >
                {OPERATORS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                value={f.value}
                onChange={(e) =>
                  api.patchView({
                    filters: view.filters.map((x) =>
                      x.id === f.id ? { ...x, value: e.target.value } : x,
                    ),
                  })
                }
                placeholder="Value"
                className="h-7 min-w-0 flex-1 rounded-md border border-nt-line px-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  api.patchView({ filters: view.filters.filter((x) => x.id !== f.id) })
                }
                className="p-1 text-nt-faint hover:text-tag-red-fg"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <MenuSep />
          <MenuItem
            icon={<Plus className="size-3.5" />}
            onClick={() =>
              api.patchView({
                filters: [
                  ...view.filters,
                  {
                    id: uid(),
                    columnId: api.state.columns[0]!.id,
                    operator: "contains",
                    value: "",
                  },
                ],
              })
            }
          >
            Add filter
          </MenuItem>
        </Pop>
      ) : null}

      {open === "sort" ? (
        <Pop anchor={sortRef.current} onClose={() => setOpen(null)} width={340} align="end">
          <MenuLabel>Sorts</MenuLabel>
          {view.sorts.map((s) => (
            <div key={s.id} className="flex items-center gap-1 px-1 py-1">
              <select
                value={s.columnId}
                onChange={(e) =>
                  api.patchView({
                    sorts: view.sorts.map((x) =>
                      x.id === s.id ? { ...x, columnId: e.target.value } : x,
                    ),
                  })
                }
                className="h-7 min-w-0 flex-1 rounded-md border border-nt-line bg-nt-surface px-1 text-xs"
              >
                {api.state.columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={s.direction}
                onChange={(e) =>
                  api.patchView({
                    sorts: view.sorts.map((x) =>
                      x.id === s.id
                        ? { ...x, direction: e.target.value as "asc" | "desc" }
                        : x,
                    ),
                  })
                }
                className="h-7 rounded-md border border-nt-line bg-nt-surface px-1 text-xs"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button
                type="button"
                onClick={() => api.patchView({ sorts: view.sorts.filter((x) => x.id !== s.id) })}
                className="p-1 text-nt-faint hover:text-tag-red-fg"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <MenuSep />
          <MenuItem
            icon={<Plus className="size-3.5" />}
            onClick={() =>
              api.patchView({
                sorts: [
                  ...view.sorts,
                  { id: uid(), columnId: api.state.columns[0]!.id, direction: "asc" },
                ],
              })
            }
          >
            Add sort
          </MenuItem>
        </Pop>
      ) : null}

      {open === "hidden" ? (
        <Pop anchor={hiddenRef.current} onClose={() => setOpen(null)} width={260} align="end">
          <MenuLabel>Properties</MenuLabel>
          {state.columns.map((c) => (
            <MenuItem
              key={c.id}
              icon={<TypeIcon type={c.type} />}
              right={c.hidden ? "Hidden" : "Shown"}
              onClick={() => api.patchColumn(c.id, { hidden: !c.hidden })}
            >
              {c.name}
            </MenuItem>
          ))}
        </Pop>
      ) : null}

      {open === "height" ? (
        <Pop anchor={heightRef.current} onClose={() => setOpen(null)} width={180} align="end">
          <MenuLabel>Row height</MenuLabel>
          {(["short", "medium", "tall"] as RowHeight[]).map((h) => (
            <MenuItem
              key={h}
              right={view.rowHeight === h ? "✓" : undefined}
              onClick={() => {
                api.patchView({ rowHeight: h });
                setOpen(null);
              }}
            >
              {h[0]!.toUpperCase() + h.slice(1)}
            </MenuItem>
          ))}
        </Pop>
      ) : null}
    </div>
  );
}
