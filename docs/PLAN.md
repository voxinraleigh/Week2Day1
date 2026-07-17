# PLAN: Account Heat Map MVP

## Overview
A local-only NextJS app showing one Account Heat Map board: Accounts as rows, 10
Technology types as columns, freeform text in each cell. Single hardcoded user.

## Tech Stack
- Next.js (latest, App Router, TypeScript)
- Tailwind CSS for styling (color scheme from CLAUDE.md as theme tokens)
- @dnd-kit/core + @dnd-kit/sortable for row drag-and-drop (react-beautiful-dnd is unmaintained)
- No database: single JSON file on disk (`data/board.json`) read/written via API routes
- Auth: hardcoded credentials, httpOnly session cookie, checked in middleware

## Data Model
```ts
type Board = {
  technologies: string[];       // fixed length 10, renamable
  accounts: Account[];          // order = row order
};

type Account = {
  id: string;
  name: string;
  cells: Record<string /* technology index or id */, string>;
};
```
Stored as a single JSON blob in `data/board.json`. Seeded with 10 default
technology names and zero accounts on first run.

## Auth Flow
- `/login` page: form posts to `POST /api/login`, checks against hardcoded
  `user` / `password`, sets a signed httpOnly cookie on success.
- `middleware.ts` gates all routes except `/login` and static assets, redirects
  to `/login` if cookie is missing/invalid.
- `POST /api/logout` clears the cookie.

## Pages / Routes
- `/login` — sign-in form
- `/` — the heat map board (protected)
- `/api/login`, `/api/logout` — auth
- `/api/board` — `GET` returns board JSON, `PUT` overwrites it

## Components
- `BoardGrid` — renders the table: technology headers (top), account rows (left)
- `EditableCell` — inline-editable text cell (click to edit, blur/enter to save)
- `EditableHeader` — inline-renamable technology column header
- `AccountRow` — draggable row (sortable via dnd-kit), renamable account name
- `AddAccountButton` — appends a new blank account row

## Persistence Strategy
Client holds board state in React state, edits update local state immediately
(optimistic), then a debounced `PUT /api/board` writes the full board to
`data/board.json`. No partial-update endpoints — keep it simple, single MVP
board, low write volume.

## Drag-and-Drop
- Whole `AccountRow` (name + all its cell data) is the drag unit.
- `@dnd-kit/sortable` vertical list strategy on the accounts array.
- On drop, reorder `accounts` array client-side, then persist via `PUT /api/board`.

## Build Steps
1. Scaffold Next.js + TypeScript + Tailwind project
2. Add color scheme as Tailwind theme tokens
3. Implement hardcoded auth (login page, middleware, cookie)
4. Implement `data/board.json` read/write + `/api/board` route with seed data
5. Build `BoardGrid` read-only rendering from `/api/board`
6. Add inline editing for cells and headers
7. Add "Add Account" 
8. Add drag-and-drop row reordering
9. Wire up debounced persistence for all edit/reorder actions
10. Manual pass: sign in, rename tech/account, add account, edit cells, drag reorder, refresh to confirm persistence

## Out of Scope (per CLAUDE.md Limitations)
- Multiple boards
- Real user accounts / multi-user auth
- Any deployment/hosting concerns — local only
