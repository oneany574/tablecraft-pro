export type ColumnType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "person"
  | "checkbox"
  | "url"
  | "files"
  | "formula";

export type TagColor =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export const TAG_COLORS: TagColor[] = [
  "default",
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
];

export interface SelectOption {
  id: string;
  name: string;
  color: TagColor;
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  options?: SelectOption[];
  formula?: string;
  width: number;
  hidden?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  url: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  at: string;
}

export type CellValue = string | number | boolean | string[] | FileItem[] | null;

export interface Row {
  id: string;
  icon: string;
  cover: string | null;
  cells: Record<string, CellValue>;
  comments: Comment[];
}

export interface SortRule {
  id: string;
  columnId: string;
  direction: "asc" | "desc";
}

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "is"
  | "is_not"
  | "is_empty"
  | "is_not_empty";

export interface FilterRule {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value: string;
}

export type RowHeight = "short" | "medium" | "tall";

export interface ViewConfig {
  id: string;
  name: string;
  type: "table" | "board";
  sorts: SortRule[];
  filters: FilterRule[];
  groupBy: string | null;
  rowHeight: RowHeight;
}

export interface Person {
  id: string;
  name: string;
  color: TagColor;
}

export interface DatabaseState {
  title: string;
  columns: Column[];
  rows: Row[];
  people: Person[];
  views: ViewConfig[];
  activeViewId: string;
  search: string;
}

export const COLUMN_TYPE_LABELS: Record<ColumnType, string> = {
  text: "Text",
  number: "Number",
  select: "Select",
  multi_select: "Multi-select",
  status: "Status",
  date: "Date",
  person: "Person",
  checkbox: "Checkbox",
  url: "URL",
  files: "Files & media",
  formula: "Formula",
};
