import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useDatabase, visibleRows } from "@/lib/notion/store";
import { Toolbar } from "@/components/notion/Toolbar";
import { TableView } from "@/components/notion/TableView";
import { BoardView } from "@/components/notion/BoardView";
import { RowDrawer } from "@/components/notion/RowDrawer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Notion-style Database Table — Tasks Workspace" },
      {
        name: "description",
        content:
          "A Notion-style database with typed columns, inline editing, drag-and-drop rows and columns, filters, sorts, a board view and a row detail drawer.",
      },
      { property: "og:title", content: "Notion-style Database Table — Tasks Workspace" },
      {
        property: "og:description",
        content:
          "Typed properties, inline editing, drag-and-drop, filters, sorts, board view and a row drawer — all saved in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const api = useDatabase();
  const [openRow, setOpenRow] = useState<string | null>(null);
  const rows = visibleRows(api.state, api.view);

  return (
    <main className="min-h-screen bg-nt-surface text-nt-text">
      <div className="mx-auto max-w-[1400px] px-10 py-10">
        <input
          value={api.state.title}
          onChange={(e) => api.setTitle(e.target.value)}
          className="mb-1 w-full bg-transparent text-[40px] font-bold leading-tight outline-none placeholder:text-nt-faint"
          placeholder="Untitled"
        />
        <p className="mb-4 text-[13px] text-nt-muted">
          Everything you change is saved in this browser.
        </p>

        <Toolbar api={api} />

        {api.view.type === "table" ? (
          <TableView api={api} onOpenRow={setOpenRow} />
        ) : (
          <BoardView api={api} onOpenRow={setOpenRow} />
        )}
      </div>

      {openRow ? (
        <RowDrawer
          api={api}
          rows={rows}
          rowId={openRow}
          onClose={() => setOpenRow(null)}
          onNavigate={setOpenRow}
        />
      ) : null}
    </main>
  );
}
