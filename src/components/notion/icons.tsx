import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  CircleDashed,
  Hash,
  Link as LinkIcon,
  List,
  Paperclip,
  Sigma,
  Tags,
  User,
} from "lucide-react";
import type { ColumnType } from "@/lib/notion/types";

export function TypeIcon({ type, className = "size-3.5" }: { type: ColumnType; className?: string }) {
  const map: Record<ColumnType, typeof Hash> = {
    text: AlignLeft,
    number: Hash,
    select: List,
    multi_select: Tags,
    status: CircleDashed,
    date: CalendarDays,
    person: User,
    checkbox: CheckSquare,
    url: LinkIcon,
    files: Paperclip,
    formula: Sigma,
  };
  const Icon = map[type] ?? AlignLeft;
  return <Icon className={className} />;
}
