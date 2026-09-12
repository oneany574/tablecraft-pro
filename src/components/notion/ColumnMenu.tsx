import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  EyeOff,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import type { DatabaseApi } from "@/lib/notion/store";
import { uid } from "@/lib/notion/store";
import {
  COLUMN_TYPE_LABELS,
  TAG_COLORS,
  type Column,
  type ColumnType,
  type TagColor,
} from "@/lib/notion/types";
import { ColorDot, MenuItem, MenuLabel, MenuSep, Tag, TextField } from "./ui";
import { TypeIcon } from "./icons";

const TYPES = Object.keys(COLUMN_TYPE_LABELS) as ColumnType[];

export function ColumnMenu({
  col,
  api,
  onClose,
}: {
  col: Column;
  api: DatabaseApi;
  onClose: () => void;
}) {
  const [name, setName] = useState(col.name);
  const [pane, setPane] = useState<"main" | "type" | "options">("main");

  if (pane === "type") {
    return (
      <div className="py-1">
        <MenuLabel>Property type</MenuLabel>
        {TYPES.map((t) => (
          <MenuItem
            key={t}
            icon={<TypeIcon type={t} />}
            onClick={() => {
              api.patchColumn(col.id, {
                type: t,
                options:
                  t === "select" || t === "multi_select" || t === "status"
                    ? (col.options ?? [])
                    : col.options,
                formula: t === "formula" ? (col.formula ?? "1 + 1") : col.formula,
              });
              setPane("main");
            }}
            right={col.type === t ? "✓" : undefined}
          >
            {COLUMN_TYPE_LABELS[t]}
          </MenuItem>
        ))}
      </div>
    );
  }

  if (pane === "options") {
    return <OptionsPane col={col} api={api} onBack={() => setPane("main")} />;
  }

  const hasOptions = col.type === "select" || col.type === "multi_select" || col.type === "status";

  return (
    <div className="py-1">
      <div className="px-1 pb-1">
        <TextField
          value={name}
          onChange={(v) => {
            setName(v);
            api.patchColumn(col.id, { name: v });
          }}
          autoFocus
          placeholder="Property name"
          onEnter={onClose}
        />
      </div>
      <MenuItem
        icon={<TypeIcon type={col.type} />}
        right={COLUMN_TYPE_LABELS[col.type]}
        onClick={() => setPane("type")}
      >
        Type
      </MenuItem>
      {hasOptions ? (
        <MenuItem icon={<Plus className="size-3.5" />} onClick={() => setPane("options")}>
          Edit options
        </MenuItem>
      ) : null}
      {col.type === "formula" ? (
        <div className="px-1 py-1">
          <MenuLabel>Formula</MenuLabel>
          <TextField
            value={col.formula ?? ""}
            onChange={(v) => api.patchColumn(col.id, { formula: v })}
            placeholder="{Estimate} * 120"
          />
          <p className="px-1 pt-1 text-xs text-nt-muted">
            Reference properties with {"{"}Name{"}"}.
          </p>
        </div>
      ) : null}
      <MenuSep />
      <MenuItem
        icon={<ArrowUp className="size-3.5" />}
        onClick={() => {
          api.setSort(col.id, "asc");
          onClose();
        }}
      >
        Sort ascending
      </MenuItem>
      <MenuItem
        icon={<ArrowDown className="size-3.5" />}
        onClick={() => {
          api.setSort(col.id, "desc");
          onClose();
        }}
      >
        Sort descending
      </MenuItem>
      <MenuSep />
      <MenuItem
        icon={<Copy className="size-3.5" />}
        onClick={() => {
          api.duplicateColumn(col.id);
          onClose();
        }}
      >
        Duplicate property
      </MenuItem>
      <MenuItem
        icon={<EyeOff className="size-3.5" />}
        onClick={() => {
          api.patchColumn(col.id, { hidden: true });
          onClose();
        }}
      >
        Hide in view
      </MenuItem>
      <MenuItem
        icon={<Trash2 className="size-3.5" />}
        danger
        onClick={() => {
          api.deleteColumn(col.id);
          onClose();
        }}
      >
        Delete property
      </MenuItem>
    </div>
  );
}

function OptionsPane({
  col,
  api,
  onBack,
}: {
  col: Column;
  api: DatabaseApi;
  onBack: () => void;
}) {
  const [newName, setNewName] = useState("");
  const options = col.options ?? [];
  const update = (next: typeof options) => api.patchColumn(col.id, { options: next });

  return (
    <div className="py-1">
      <MenuItem icon={<Wand2 className="size-3.5" />} onClick={onBack}>
        Back to property
      </MenuItem>
      <MenuSep />
      <MenuLabel>Options</MenuLabel>
      {options.map((o) => (
        <div key={o.id} className="space-y-1 rounded-md px-2 py-1 hover:bg-nt-hover">
          <div className="flex items-center gap-2">
            <Tag color={o.color}>{o.name}</Tag>
            <input
              value={o.name}
              onChange={(e) =>
                update(options.map((x) => (x.id === o.id ? { ...x, name: e.target.value } : x)))
              }
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            />
            <button
              type="button"
              onClick={() => update(options.filter((x) => x.id !== o.id))}
              className="text-nt-faint hover:text-tag-red-fg"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() =>
                  update(options.map((x) => (x.id === o.id ? { ...x, color: c as TagColor } : x)))
                }
                className="rounded p-0.5 hover:bg-nt-active"
              >
                <ColorDot color={c} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="px-1 pt-1">
        <TextField
          value={newName}
          onChange={setNewName}
          placeholder="New option name"
          onEnter={() => {
            if (!newName.trim()) return;
            update([
              ...options,
              {
                id: uid(),
                name: newName.trim(),
                color: TAG_COLORS[options.length % TAG_COLORS.length]!,
              },
            ]);
            setNewName("");
          }}
        />
      </div>
    </div>
  );
}
