import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CellValue,
  Column,
  ColumnType,
  DatabaseState,
  FilterRule,
  Row,
  SortRule,
  ViewConfig,
} from "./types";

const STORAGE_KEY = "notion-db-clone-v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): DatabaseState {
  const cols: Column[] = [
    { id: "c_name", name: "Name", type: "text", width: 260 },
    {
      id: "c_status",
      name: "Status",
      type: "status",
      width: 140,
      options: [
        { id: "s1", name: "Not started", color: "gray" },
        { id: "s2", name: "In progress", color: "blue" },
        { id: "s3", name: "In review", color: "yellow" },
        { id: "s4", name: "Done", color: "green" },
      ],
    },
    {
      id: "c_priority",
      name: "Priority",
      type: "select",
      width: 120,
      options: [
        { id: "p1", name: "Low", color: "gray" },
        { id: "p2", name: "Medium", color: "yellow" },
        { id: "p3", name: "High", color: "red" },
      ],
    },
    {
      id: "c_tags",
      name: "Tags",
      type: "multi_select",
      width: 200,
      options: [
        { id: "t1", name: "Design", color: "purple" },
        { id: "t2", name: "Engineering", color: "blue" },
        { id: "t3", name: "Research", color: "orange" },
        { id: "t4", name: "Docs", color: "brown" },
      ],
    },
    { id: "c_owner", name: "Owner", type: "person", width: 150 },
    { id: "c_due", name: "Due date", type: "date", width: 140 },
    { id: "c_done", name: "Done", type: "checkbox", width: 80 },
    { id: "c_est", name: "Estimate", type: "number", width: 110 },
    {
      id: "c_cost",
      name: "Cost",
      type: "formula",
      width: 110,
      formula: "{Estimate} * 120",
    },
    { id: "c_link", name: "Link", type: "url", width: 180 },
    { id: "c_files", name: "Files", type: "files", width: 160 },
  ];

  const people = [
    { id: "u1", name: "Ada Lovelace", color: "purple" as const },
    { id: "u2", name: "Grace Hopper", color: "blue" as const },
    { id: "u3", name: "Alan Turing", color: "green" as const },
  ];

  const base = [
    ["Redesign onboarding flow", "s2", "p3", ["t1"], ["u1"], "2026-09-24", false, 12],
    ["Migrate billing service", "s1", "p3", ["t2"], ["u2"], "2026-10-02", false, 30],
    ["User interviews round 3", "s4", "p2", ["t3"], ["u3"], "2026-09-08", true, 8],
    ["Write API reference", "s3", "p1", ["t4", "t2"], ["u2"], "2026-09-30", false, 6],
    ["Dark mode polish", "s2", "p2", ["t1", "t2"], ["u1"], "2026-09-19", false, 4],
    ["Reduce cold start time", "s1", "p2", ["t2"], ["u3"], "2026-10-14", false, 16],
    ["Pricing page copy", "s4", "p1", ["t4"], ["u1"], "2026-09-05", true, 3],
    ["Accessibility audit", "s3", "p3", ["t1", "t3"], ["u3"], "2026-09-28", false, 10],
  ] as const;

  const icons = ["📌", "💳", "🎙️", "📘", "🌘", "⚡", "💰", "♿"];

  const rows: Row[] = base.map((r, i) => ({
    id: uid(),
    icon: icons[i] ?? "📄",
    cover: null,
    comments:
      i === 0
        ? [
            {
              id: uid(),
              author: "Grace Hopper",
              text: "Let's ship the first pass this week.",
              at: new Date().toISOString(),
            },
          ]
        : [],
    cells: {
      c_name: r[0],
      c_status: r[1],
      c_priority: r[2],
      c_tags: [...r[3]],
      c_owner: [...r[4]],
      c_due: r[5],
      c_done: r[6],
      c_est: r[7],
      c_link: "https://example.com",
      c_files: [],
    },
  }));

  const views: ViewConfig[] = [
    {
      id: "v_table",
      name: "All tasks",
      type: "table",
      sorts: [],
      filters: [],
      groupBy: null,
      rowHeight: "short",
    },
    {
      id: "v_board",
      name: "Board",
      type: "board",
      sorts: [],
      filters: [],
      groupBy: "c_status",
      rowHeight: "short",
    },
  ];

  return {
    title: "Project tasks",
    columns: cols,
    rows,
    people,
    views,
    activeViewId: "v_table",
    search: "",
  };
}

export function emptyValue(type: ColumnType): CellValue {
  switch (type) {
    case "checkbox":
      return false;
    case "multi_select":
    case "person":
      return [];
    case "files":
      return [];
    case "number":
      return null;
    default:
      return "";
  }
}

/** Evaluate a formula like "{Estimate} * 120" against a row. */
export function evalFormula(
  formula: string | undefined,
  row: Row,
  columns: Column[],
): string {
  if (!formula) return "";
  try {
    const expr = formula.replace(/\{([^}]+)\}/g, (_m, name: string) => {
      const col = columns.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
      if (!col) return "0";
      const v = row.cells[col.id];
      if (typeof v === "number") return String(v);
      if (typeof v === "boolean") return v ? "1" : "0";
      if (typeof v === "string") return JSON.stringify(v);
      return "0";
    });
    if (/[;`]|=>|\bwindow\b|\bdocument\b|\bfetch\b/.test(expr)) return "⚠️";
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${expr});`);
    const out = fn();
    if (typeof out === "number") return Number.isFinite(out) ? String(out) : "—";
    return String(out ?? "");
  } catch {
    return "⚠️";
  }
}

export function cellText(
  row: Row,
  col: Column,
  state: DatabaseState,
): string {
  const v = row.cells[col.id];
  switch (col.type) {
    case "select":
    case "status":
      return col.options?.find((o) => o.id === v)?.name ?? "";
    case "multi_select":
      return ((v as string[]) ?? [])
        .map((id) => col.options?.find((o) => o.id === id)?.name ?? "")
        .join(" ");
    case "person":
      return ((v as string[]) ?? [])
        .map((id) => state.people.find((p) => p.id === id)?.name ?? "")
        .join(" ");
    case "files":
      return (v as { name: string }[] | undefined)?.map((f) => f.name).join(" ") ?? "";
    case "checkbox":
      return v ? "yes" : "no";
    case "formula":
      return evalFormula(col.formula, row, state.columns);
    default:
      return v == null ? "" : String(v);
  }
}

function matchesFilter(
  row: Row,
  rule: FilterRule,
  state: DatabaseState,
): boolean {
  const col = state.columns.find((c) => c.id === rule.columnId);
  if (!col) return true;
  const text = cellText(row, col, state).toLowerCase();
  const needle = rule.value.trim().toLowerCase();
  switch (rule.operator) {
    case "contains":
      return text.includes(needle);
    case "not_contains":
      return !text.includes(needle);
    case "is":
      return text === needle;
    case "is_not":
      return text !== needle;
    case "is_empty":
      return text.length === 0;
    case "is_not_empty":
      return text.length > 0;
    default:
      return true;
  }
}

export function visibleRows(state: DatabaseState, view: ViewConfig): Row[] {
  let rows = state.rows.filter((r) => view.filters.every((f) => matchesFilter(r, f, state)));
  const q = state.search.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) =>
      state.columns.some((c) => cellText(r, c, state).toLowerCase().includes(q)),
    );
  }
  if (view.sorts.length) {
    rows = [...rows].sort((a, b) => {
      for (const s of view.sorts) {
        const col = state.columns.find((c) => c.id === s.columnId);
        if (!col) continue;
        const av = a.cells[col.id];
        const bv = b.cells[col.id];
        let cmp: number;
        if (typeof av === "number" || typeof bv === "number") {
          cmp = (Number(av) || 0) - (Number(bv) || 0);
        } else {
          cmp = cellText(a, col, state).localeCompare(cellText(b, col, state));
        }
        if (cmp !== 0) return s.direction === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }
  return rows;
}

export function useDatabase() {
  const [state, setState] = useState<DatabaseState>(() => seed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as DatabaseState);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state, hydrated]);

  const view = useMemo(
    () => state.views.find((v) => v.id === state.activeViewId) ?? state.views[0],
    [state],
  );

  const patchView = useCallback((patch: Partial<ViewConfig>) => {
    setState((s) => ({
      ...s,
      views: s.views.map((v) => (v.id === s.activeViewId ? { ...v, ...patch } : v)),
    }));
  }, []);

  const setCell = useCallback((rowId: string, colId: string, value: CellValue) => {
    setState((s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r,
      ),
    }));
  }, []);

  const patchRow = useCallback((rowId: string, patch: Partial<Row>) => {
    setState((s) => ({
      ...s,
      rows: s.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    }));
  }, []);

  const addRow = useCallback(
    (preset?: Record<string, CellValue>) => {
      const id = uid();
      setState((s) => {
        const cells: Record<string, CellValue> = {};
        s.columns.forEach((c) => (cells[c.id] = emptyValue(c.type)));
        return {
          ...s,
          rows: [
            ...s.rows,
            { id, icon: "📄", cover: null, comments: [], cells: { ...cells, ...preset } },
          ],
        };
      });
      return id;
    },
    [],
  );

  const duplicateRow = useCallback((rowId: string) => {
    setState((s) => {
      const i = s.rows.findIndex((r) => r.id === rowId);
      if (i < 0) return s;
      const copy: Row = {
        ...s.rows[i],
        id: uid(),
        comments: [],
        cells: { ...s.rows[i].cells },
      };
      const rows = [...s.rows];
      rows.splice(i + 1, 0, copy);
      return { ...s, rows };
    });
  }, []);

  const deleteRow = useCallback((rowId: string) => {
    setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== rowId) }));
  }, []);

  const moveRow = useCallback((fromId: string, toId: string) => {
    setState((s) => {
      const from = s.rows.findIndex((r) => r.id === fromId);
      const to = s.rows.findIndex((r) => r.id === toId);
      if (from < 0 || to < 0 || from === to) return s;
      const rows = [...s.rows];
      const [moved] = rows.splice(from, 1);
      rows.splice(to, 0, moved);
      return { ...s, rows };
    });
  }, []);

  const moveColumn = useCallback((fromId: string, toId: string) => {
    setState((s) => {
      const from = s.columns.findIndex((c) => c.id === fromId);
      const to = s.columns.findIndex((c) => c.id === toId);
      if (from < 0 || to < 0 || from === to) return s;
      const columns = [...s.columns];
      const [moved] = columns.splice(from, 1);
      columns.splice(to, 0, moved);
      return { ...s, columns };
    });
  }, []);

  const patchColumn = useCallback((colId: string, patch: Partial<Column>) => {
    setState((s) => ({
      ...s,
      columns: s.columns.map((c) => (c.id === colId ? { ...c, ...patch } : c)),
    }));
  }, []);

  const addColumn = useCallback((type: ColumnType = "text") => {
    const id = "c_" + uid();
    setState((s) => ({
      ...s,
      columns: [
        ...s.columns,
        {
          id,
          name: `${type === "text" ? "Property" : type} ${s.columns.length + 1}`,
          type,
          width: 160,
          options: type === "select" || type === "multi_select" || type === "status" ? [] : undefined,
        },
      ],
      rows: s.rows.map((r) => ({ ...r, cells: { ...r.cells, [id]: emptyValue(type) } })),
    }));
    return id;
  }, []);

  const duplicateColumn = useCallback((colId: string) => {
    setState((s) => {
      const i = s.columns.findIndex((c) => c.id === colId);
      if (i < 0) return s;
      const src = s.columns[i];
      const id = "c_" + uid();
      const columns = [...s.columns];
      columns.splice(i + 1, 0, { ...src, id, name: `${src.name} copy` });
      return {
        ...s,
        columns,
        rows: s.rows.map((r) => ({ ...r, cells: { ...r.cells, [id]: r.cells[colId] } })),
      };
    });
  }, []);

  const deleteColumn = useCallback((colId: string) => {
    setState((s) =>
      s.columns.length <= 1
        ? s
        : { ...s, columns: s.columns.filter((c) => c.id !== colId) },
    );
  }, []);

  const setSort = useCallback(
    (columnId: string, direction: "asc" | "desc") => {
      patchView({ sorts: [{ id: uid(), columnId, direction }] });
    },
    [patchView],
  );

  const setSearch = useCallback((search: string) => setState((s) => ({ ...s, search })), []);
  const setActiveView = useCallback(
    (id: string) => setState((s) => ({ ...s, activeViewId: id })),
    [],
  );
  const setTitle = useCallback((title: string) => setState((s) => ({ ...s, title })), []);

  const addComment = useCallback((rowId: string, text: string) => {
    setState((s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.id === rowId
          ? {
              ...r,
              comments: [
                ...r.comments,
                { id: uid(), author: "You", text, at: new Date().toISOString() },
              ],
            }
          : r,
      ),
    }));
  }, []);

  const resetAll = useCallback(() => setState(seed()), []);

  return {
    state,
    view,
    hydrated,
    patchView,
    setCell,
    patchRow,
    addRow,
    duplicateRow,
    deleteRow,
    moveRow,
    moveColumn,
    patchColumn,
    addColumn,
    duplicateColumn,
    deleteColumn,
    setSort,
    setSearch,
    setActiveView,
    setTitle,
    addComment,
    resetAll,
  };
}

export type DatabaseApi = ReturnType<typeof useDatabase>;
export type { SortRule };
