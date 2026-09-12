import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { TagColor } from "@/lib/notion/types";

const TAG_CLASS: Record<TagColor, string> = {
  default: "bg-tag-default-bg text-tag-default-fg",
  gray: "bg-tag-gray-bg text-tag-gray-fg",
  brown: "bg-tag-brown-bg text-tag-brown-fg",
  orange: "bg-tag-orange-bg text-tag-orange-fg",
  yellow: "bg-tag-yellow-bg text-tag-yellow-fg",
  green: "bg-tag-green-bg text-tag-green-fg",
  blue: "bg-tag-blue-bg text-tag-blue-fg",
  purple: "bg-tag-purple-bg text-tag-purple-fg",
  pink: "bg-tag-pink-bg text-tag-pink-fg",
  red: "bg-tag-red-bg text-tag-red-fg",
};

export function Tag({
  color = "default",
  children,
  className,
}: {
  color?: TagColor;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-sm px-1.5 py-0.5 text-xs leading-4",
        TAG_CLASS[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ColorDot({ color }: { color: TagColor }) {
  return <span className={cn("size-3 shrink-0 rounded-full", TAG_CLASS[color])} />;
}

/** Lightweight anchored popover rendered in a portal. */
export function Pop({
  anchor,
  onClose,
  children,
  width = 260,
  align = "start",
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  align?: "start" | "end";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const left =
      align === "end"
        ? Math.max(8, r.right - width)
        : Math.min(r.left, window.innerWidth - width - 8);
    const top = Math.min(r.bottom + 4, window.innerHeight - 80);
    setPos({ top, left: Math.max(8, left) });
  }, [anchor, width, align]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      const t = e.target as Node;
      if (!ref.current.contains(t) && !anchor?.contains(t)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined" || !pos) return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      style={{ top: pos.top, left: pos.left, width }}
      className="fixed z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-nt-line bg-nt-surface p-1 text-sm text-nt-text shadow-[0_12px_32px_-8px_rgba(15,15,15,0.2),0_0_0_1px_rgba(15,15,15,0.04)] animate-in fade-in-0 zoom-in-95"
    >
      {children}
    </div>,
    document.body,
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
  right,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  right?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-nt-hover",
        danger ? "text-tag-red-fg" : "text-nt-text",
      )}
    >
      {icon ? <span className="flex size-4 items-center justify-center text-nt-muted">{icon}</span> : null}
      <span className="flex-1 truncate">{children}</span>
      {right ? <span className="text-xs text-nt-muted">{right}</span> : null}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2 pt-2 pb-1 text-xs font-medium text-nt-muted">{children}</div>;
}

export function MenuSep() {
  return <div className="my-1 h-px bg-nt-line" />;
}

export function TextField({
  value,
  onChange,
  placeholder,
  autoFocus,
  onEnter,
  className,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
  className?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      className={cn(
        "w-full rounded-md border border-nt-line bg-nt-hover px-2 py-1 text-sm text-nt-text outline-none placeholder:text-nt-faint focus:border-nt-blue focus:bg-nt-surface",
        className,
      )}
    />
  );
}

export function ToolbarButton({
  children,
  onClick,
  active,
  title,
  innerRef,
}: {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  title?: string;
  innerRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={innerRef}
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[13px] text-nt-muted transition-colors hover:bg-nt-hover hover:text-nt-text",
        active && "bg-nt-active text-nt-text",
      )}
    >
      {children}
    </button>
  );
}
