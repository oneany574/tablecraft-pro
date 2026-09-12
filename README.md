# TableCraft Pro

Build a full-featured clone of Notion's Database Table view. Core features to implement: 1) Table with typed columns (text, number, select, multi-select, date, person, checkbox, URL, files, status, formula if feasible), inline column editors to rename, change type, edit options, duplicate, delete, hide, and sort columns. 2) Row drawer: clicking a row's expand icon opens a Notion-style side drawer showing all properties as editable fields, cover/icon, comments or notes section, and prev/next row navigation. 3) Drag and drop: reorder rows by dragging the row handle, and reorder columns by dragging headers, with smooth animations and drop indicators. 4) Toolbar: add/filter/sort rows and columns, search, grouping, row height options, and views (Table plus at least Board/Kanban if quick). 5) Add new rows inline at bottom, add new columns, property menu popover. 6) Persist data so edits survive reloads. Aim for pixel-close Notion styling: light UI, subtle hover states, small icons, keyboard-friendly.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed8abc61-30bb-4a31-a421-5389693d7870).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
