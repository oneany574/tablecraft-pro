import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { evalFormula, uid, type DatabaseApi } from "@/lib/notion/store";
import { TAG_COLORS, type Column, type FileItem, type Row, type TagColor } from "@/lib/notion/types";
import { ColorDot, MenuItem, MenuLabel, MenuSep, Pop, Tag, TextField } from "./ui";

interface CellProps {
  row: Row;
  col: Column;
  api: DatabaseApi;
  variant?: "table" | "drawer";
}

export function Cell({ row, col, api, variant = "table" }: CellProps) {
  const [editing, setEditing] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const value = row.cells[col.id];
  const boxRef = useRef<HTMLDivElement>(null);

  const base = cn(
    "flex h-full w-full items-center gap-1 overflow-hidden px-2 py-1 text-[13px] text-nt-text",
    variant === "drawer" && "rounded-md px-2 py-1 hover:bg-nt-hover",
  );

  const set = (v: Parameters<DatabaseApi["setCell"]>[2]) => api.setCell(row.id, col.id, v);

  const addOption = (name: string): string => {
    const id = uid();
    const color = TAG_COLORS[(col.options?.length ?? 0) % TAG_COLORS.length];
    api.patchColumn(col.id, { options: [...(col.options ?? []), { id, name, color }] });
    return id;
  };

  if (col.type === "checkbox") {
    return (
      <div className={base}>
        <button
          type="button"
          role="checkbox"
          aria-checked={!!value}
          aria-label={col.name}
          onClick={() => set(!value)}
          className={cn(
            "flex size-4 items-center justify-center rounded-[3px] border transition-colors",
            value ? "border-nt-blue bg-nt-blue" : "border-nt-faint",
          )}
        >
          {value ? <Check className="size-3 text-nt-surface" strokeWidth={3} /> : null}
        </button>
      </div>
    );
  }

  if (col.type === "formula") {
    return (
      <div className={cn(base, "text-nt-muted")}>
        <span className="truncate">{evalFormula(col.formula, row, api.state.columns)}</span>
      </div>
    );
  }

  if (col.type === "text" || col.type === "number" || col.type === "url") {
    return (
      <InlineText
        className={base}
        value={value == null ? "" : String(value)}
        type={col.type}
        editing={editing}
        setEditing={setEditing}
        onCommit={(v) => set(col.type === "number" ? (v === "" ? null : Number(v)) : v)}
      />
    );
  }

  if (col.type === "date") {
    return (
      <div className={base}>
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => set(e.target.value)}
          className="w-full bg-transparent text-[13px] text-nt-text outline-none [color-scheme:light]"
        />
      </div>
    );
  }

  // Popover-driven types
  return (
    <>
      <div
        ref={boxRef}
        tabIndex={-1}
        role="button"
        onClick={(e) => setAnchor(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setAnchor(e.currentTarget);
        }}
        className={cn(base, "cursor-pointer")}
      >
        <CellPreview row={row} col={col} api={api} />
      </div>
      {anchor ? (
        <Pop anchor={anchor} onClose={() => setAnchor(null)} width={280}>
          {col.type === "select" || col.type === "status" ? (
            <SelectPicker
              col={col}
              api={api}
              selected={typeof value === "string" ? [value] : []}
              multi={false}
              onToggle={(id) => {
                set(value === id ? "" : id);
                setAnchor(null);
              }}
              addOption={addOption}
            />
          ) : null}
          {col.type === "multi_select" ? (
            <SelectPicker
              col={col}
              api={api}
              selected={(value as string[]) ?? []}
              multi
              onToggle={(id) => {
                const cur = ((value as string[]) ?? []).slice();
                const i = cur.indexOf(id);
                if (i >= 0) cur.splice(i, 1);
                else cur.push(id);
                set(cur);
              }}
              addOption={addOption}
            />
          ) : null}
          {col.type === "person" ? (
            <div className="py-1">
              <MenuLabel>Select a person</MenuLabel>
              {api.state.people.map((p) => {
                const cur = ((value as string[]) ?? []);
                const on = cur.includes(p.id);
                return (
                  <MenuItem
                    key={p.id}
                    icon={<ColorDot color={p.color} />}
                    right={on ? <Check className="size-3.5" /> : undefined}
                    onClick={() =>
                      set(on ? cur.filter((x) => x !== p.id) : [...cur, p.id])
                    }
                  >
                    {p.name}
                  </MenuItem>
                );
              })}
            </div>
          ) : null}
          {col.type === "files" ? (
            <FilesEditor
              files={(value as FileItem[]) ?? []}
              onChange={(f) => set(f)}
            />
          ) : null}
        </Pop>
      ) : null}
    </>
  );
}

function InlineText({
  value,
  onCommit,
  editing,
  setEditing,
  className,
  type,
}: {
  value: string;
  onCommit: (v: string) => void;
  editing: boolean;
  setEditing: (v: boolean) => void;
  className?: string;
  type: "text" | "number" | "url";
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value, editing]);

  if (editing) {
    return (
      <div className={className}>
        <input
          autoFocus
          type={type === "number" ? "number" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onCommit(draft);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onCommit(draft);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full bg-transparent text-[13px] text-nt-text outline-none"
        />
      </div>
    );
  }

  return (
    <div className={cn(className, "cursor-text")} onClick={() => setEditing(true)}>
      {type === "url" && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="truncate text-nt-blue underline underline-offset-2"
        >
          {value}
        </a>
      ) : (
        <span className="truncate">{value}</span>
      )}
    </div>
  );
}

export function CellPreview({ row, col, api }: { row: Row; col: Column; api: DatabaseApi }) {
  const value = row.cells[col.id];
  if (col.type === "select" || col.type === "status") {
    const opt = col.options?.find((o) => o.id === value);
    if (!opt) return <span className="text-nt-faint">Empty</span>;
    return (
      <Tag color={opt.color}>
        {col.type === "status" ? <ColorDot color={opt.color} /> : null}
        {opt.name}
      </Tag>
    );
  }
  if (col.type === "multi_select") {
    const ids = (value as string[]) ?? [];
    if (!ids.length) return <span className="text-nt-faint">Empty</span>;
    return (
      <div className="flex gap-1 overflow-hidden">
        {ids.map((id) => {
          const o = col.options?.find((x) => x.id === id);
          return o ? (
            <Tag key={id} color={o.color}>
              {o.name}
            </Tag>
          ) : null;
        })}
      </div>
    );
  }
  if (col.type === "person") {
    const ids = (value as string[]) ?? [];
    if (!ids.length) return <span className="text-nt-faint">Empty</span>;
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        {ids.map((id) => {
          const p = api.state.people.find((x) => x.id === id);
          return p ? (
            <span key={id} className="flex items-center gap-1 text-[13px]">
              <ColorDot color={p.color} />
              <span className="truncate">{p.name}</span>
            </span>
          ) : null;
        })}
      </div>
    );
  }
  if (col.type === "files") {
    const files = (value as FileItem[]) ?? [];
    if (!files.length) return <span className="text-nt-faint">Empty</span>;
    return (
      <div className="flex gap-1 overflow-hidden">
        {files.map((f) => (
          <Tag key={f.id} color="gray">
            {f.name}
          </Tag>
        ))}
      </div>
    );
  }
  return <span className="text-nt-faint">Empty</span>;
}

function SelectPicker({
  col,
  api,
  selected,
  multi,
  onToggle,
  addOption,
}: {
  col: Column;
  api: DatabaseApi;
  selected: string[];
  multi: boolean;
  onToggle: (id: string) => void;
  addOption: (name: string) => string;
}) {
  const [q, setQ] = useState("");
  const [colorFor, setColorFor] = useState<string | null>(null);
  const options = (col.options ?? []).filter((o) =>
    o.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const exact = (col.options ?? []).some((o) => o.name.toLowerCase() === q.trim().toLowerCase());

  return (
    <div className="py-1">
      <div className="px-1 pb-1">
        <TextField value={q} onChange={setQ} placeholder="Search or create…" autoFocus />
      </div>
      <MenuLabel>{multi ? "Select options" : "Select an option"}</MenuLabel>
      {options.map((o) => (
        <div key={o.id} className="group/opt flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggle(o.id)}
            className="flex flex-1 items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-nt-hover"
          >
            <Tag color={o.color}>{o.name}</Tag>
            <span className="flex-1" />
            {selected.includes(o.id) ? <Check className="size-3.5 text-nt-muted" /> : null}
          </button>
          <button
            type="button"
            title="Change color"
            onClick={() => setColorFor(colorFor === o.id ? null : o.id)}
            className="mr-1 rounded p-1 text-nt-faint opacity-0 transition hover:bg-nt-hover group-hover/opt:opacity-100"
          >
            <ColorDot color={o.color} />
          </button>
        </div>
      ))}
      {colorFor ? (
        <>
          <MenuSep />
          <MenuLabel>Color</MenuLabel>
          <div className="grid grid-cols-5 gap-1 px-2 pb-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  api.patchColumn(col.id, {
                    options: (col.options ?? []).map((o) =>
                      o.id === colorFor ? { ...o, color: c as TagColor } : o,
                    ),
                  });
                  setColorFor(null);
                }}
                className="flex items-center justify-center rounded p-1 hover:bg-nt-hover"
              >
                <ColorDot color={c} />
              </button>
            ))}
          </div>
        </>
      ) : null}
      {q.trim() && !exact ? (
        <MenuItem
          icon={<Plus className="size-3.5" />}
          onClick={() => {
            const id = addOption(q.trim());
            onToggle(id);
            setQ("");
          }}
        >
          Create “{q.trim()}”
        </MenuItem>
      ) : null}
    </div>
  );
}

function FilesEditor({
  files,
  onChange,
}: {
  files: FileItem[];
  onChange: (f: FileItem[]) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const add = () => {
    if (!name.trim() && !url.trim()) return;
    onChange([...files, { id: uid(), name: name.trim() || "File", url: url.trim() }]);
    setName("");
    setUrl("");
  };
  return (
    <div className="space-y-1 p-1">
      <MenuLabel>Files & media</MenuLabel>
      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-nt-hover">
          <a
            href={f.url || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex-1 truncate text-[13px] text-nt-text"
          >
            {f.name}
          </a>
          <button
            type="button"
            onClick={() => onChange(files.filter((x) => x.id !== f.id))}
            className="text-nt-faint hover:text-nt-text"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <TextField value={name} onChange={setName} placeholder="File name" />
      <TextField value={url} onChange={setUrl} placeholder="https://…" onEnter={add} />
      <MenuItem icon={<Plus className="size-3.5" />} onClick={add}>
        Add file link
      </MenuItem>
    </div>
  );
}
