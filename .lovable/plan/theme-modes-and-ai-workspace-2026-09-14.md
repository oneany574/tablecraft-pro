# Theme modes and AI workspace

## What will be added
- Add a compact theme control with **Light**, **Dark**, and **System** modes. Save the choice in this browser and follow operating-system changes when System is selected.
- Extend the existing Notion-style color tokens so the table, board, menus, drawer, tags, and controls remain readable and visually consistent in dark mode.
- Add a global **AI** entry point for a project copilot that can answer workspace questions and help create, update, organize, and find tasks.
- Add separate, browser-saved AI conversation threads with a visible thread list, new-chat action, and a dedicated URL for each thread.
- Add task-level AI actions in the row drawer: **Summarize**, **Draft details**, **Break down task**, and **Suggest fields**. Show generated results before applying changes to a task.
- Preserve the current database interactions and browser persistence.

## Experience
- The global assistant opens as a focused workspace panel, with the current task database supplied as context.
- Assistant answers stream as they are generated, support formatted text, show a thinking state, and keep the prompt focused for fast follow-up questions.
- Task AI stays within the selected task drawer so suggestions remain clearly associated with that task.
- AI failures remain visible and actionable; failed requests are not disguised as successful replies.

## Technical details
- Enable Lovable Cloud for secure server-side AI calls; task and conversation data will still remain in browser storage as requested.
- Use Lovable AI with the default reasoning model through a streaming server endpoint. The API key stays server-side.
- Install and compose the official AI chat elements for conversations, messages, prompts, and loading states.
- Store thread metadata and messages by thread ID in localStorage, and add a real `/ai/$threadId` page so refresh and thread switching restore the correct chat.
- Provide model tools for workspace search and task mutations; mutation results update the existing database store only after the user invokes the assistant command.
- Add focused checks for theme persistence, thread isolation, task AI actions, desktop/mobile layout, and successful AI streaming.
