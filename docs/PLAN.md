# PLAN: Account Heat Map (v3 — multi-user, FastAPI + SQLite, Dockerized)

Supersedes v2. This is an architecture pivot, not an incremental feature add:
the app moves from a single-user local Next.js app with JSON-file storage to
a multi-user Next.js + FastAPI + SQLite app packaged as one Docker container.

## What's changing vs. v2
- **Multi-user**: 5 hardcoded users, each with their own isolated single board
  (not one shared board anymore).
- **Backend added**: Python FastAPI owns auth and persistence. SQLite via
  SQLAlchemy replaces `data/board.json`.
- **Frontend becomes a static export** served *by* FastAPI at `/`, not a
  Next.js server. This removes `proxy.ts` (no server = no middleware) and the
  `app/api/*` route handlers (no server = no API routes). All data fetching
  and auth-redirect logic moves to the client and talks to FastAPI instead.
- **Repo restructuring**: current root-level Next app moves into `frontend/`;
  new `backend/` (FastAPI, uv-managed) and `scripts/` (start/stop) directories.
- **Delete confirmation dialogs** required for: account (row) delete,
  technology (column) delete, and entry delete.
- **"Owner" field is removed** — CLAUDE.md no longer mentions it. The pinned
  last column is now just "Next steps", structurally identical to any other
  technology column (a multi-entry list) — see Data Model simplification below.
- **Docker packaging**: single multi-stage Dockerfile (Next static build →
  Python/uv runtime), one container serves both frontend and API.

## Architecture
```
frontend/   Next.js, static export (`next build` → frontend/out/), client-only
backend/    FastAPI, SQLAlchemy + SQLite, managed with uv
scripts/    start/stop scripts for Mac, PC (Windows), Linux
Dockerfile  multi-stage: build frontend, then Python runtime serving both
docs/       PLAN.md (this file)
```
FastAPI mounts `frontend/out/` as static files at `/` and exposes `/api/*` —
same origin, so cookie auth works with no CORS configuration needed.

## Auth
Five hardcoded users, checked against a fixed in-code dict (no signup, no
password changes — matches "no unnecessary defensive programming"):
```
HP     / [HP123]
JFrog  / [JFrog123]
Elastic/ [Elastic123]
F5     / [F5123]
1PW    / [1PW123]
```
`POST /api/login` validates credentials, issues a signed httpOnly session
cookie (username + HMAC signature, no server-side session store needed).
`POST /api/logout` clears it. Every board-scoped endpoint reads the username
from the verified cookie — this is what isolates each user's board.

**Assumption**: the bracket characters in the passwords above are taken
literally (e.g. the password *is* `[HP123]`, brackets included) since that's
what CLAUDE.md states verbatim. Flag if that's a formatting artifact instead.

Since there's no Next.js server, the frontend can't gate routes in
middleware. Instead: the board page always renders its shell, then fetches
`GET /api/board` on mount; a 401 redirects client-side to `/login`.

## Data Model (SQLite via SQLAlchemy)
```
Board(id, username UNIQUE, title)
Technology(id, board_id FK, name, position, is_next_steps BOOL)
Account(id, board_id FK, name, position)
Entry(id, account_id FK, technology_id FK, text, position)
```
One `Board` row per username, created lazily on first login if it doesn't
exist yet (seeded with the same 10 default technology names + one pinned
`is_next_steps` row named "Next steps").

**Simplification enabled by dropping "owner"**: the pinned column no longer
needs a separate `nextSteps`/`owner` field pair on `Account`. It's just a
`Technology` row with `is_next_steps = true` — same `Entry` mechanism as every
other column, just excluded from drag-reorder/rename/delete in the UI and
always rendered last regardless of its stored `position`.

DB file created via `SQLAlchemy` `metadata.create_all()` on backend startup
if it doesn't exist — no migration framework (Alembic) for a schema this
small, matches "never over-engineer."

## API Surface
Kept to the same shape that already worked well client-side — whole-board
`GET`/`PUT`, not granular per-field endpoints:
- `POST /api/login`, `POST /api/logout`
- `GET /api/board` — returns the current user's board (creates it if missing)
- `PUT /api/board` — replaces the current user's board (delete+reinsert
  technologies/accounts/entries in a transaction); fine at this scale (one
  local user session at a time, low write volume)

## Confirmation Dialogs
New `ConfirmDialog` component (simple modal, confirm/cancel), reused for all
three delete paths: account row, technology column, individual entry. Wired
in at the point each delete button currently fires immediately.

## Frontend Changes
- Remove `proxy.ts`, `app/api/*`, `lib/auth.ts`, `lib/board.ts` (server-side
  concerns move to `backend/`)
- `app/page.tsx` becomes a client component: fetch `/api/board` on mount,
  redirect to `/login` on 401
- `next.config.ts`: `output: "export"`
- Drop `owner` field from `AccountRow`; the pinned "Next steps" column
  renders through the same `EntryList` used for every other column
- Add `ConfirmDialog`, wire into `AccountRow` delete, `TechnologyHeader`
  delete, `EntryList` delete

## Testing Strategy
- **Backend — pytest + FastAPI `TestClient`**, one test DB per test run
  (`tmp_path` SQLite file or `:memory:`, never the real DB). Covers:
  - login: each of the 5 users succeeds, wrong password/unknown user fails,
    protected endpoints reject a missing/invalid cookie
  - per-user isolation: user A's board mutations are invisible to user B;
    board auto-creates on first access with correct seed data
  - board CRUD: rename board title; add/rename/delete technology; add/delete
    account; add/edit/delete entries; row and column reorder; column sort;
    the pinned `is_next_steps` row can't be deleted/renamed/reordered via API
- **Frontend — Playwright e2e**, checked into `frontend/tests/`, run against
  a disposable test DB (set via an env var like `DATABASE_PATH`, pointed at a
  throwaway file) — **never the real `backend/data/app.db`**. This is a
  direct lesson from this session: an earlier manual verification pass ran
  destructive actions against real board data by accident. Covers:
  - login/logout for at least two different users, confirming isolated boards
  - full golden path: title edit, column add/rename/delete/reorder/sort, row
    add/rename/delete/reorder, multi-entry add/delete in a cell
  - confirm dialog: appears on delete, cancel keeps the item, confirm removes it
  - reload confirms persistence
- No component-level frontend unit tests (e.g. Vitest/RTL) — the pytest suite
  covers business logic and Playwright covers the interactive/DnD/dialog
  behavior that's hard to unit test meaningfully; adding a third test layer
  would be over-engineering for this MVP's size.

## Docker & Scripts
- Single multi-stage `Dockerfile`: stage 1 (`node`) runs `next build` in
  `frontend/`; stage 2 (`python` + `uv`) copies `frontend/out/` in, installs
  backend deps with `uv sync`, runs `uvicorn` serving API + static files.
- `scripts/start.sh` / `start.bat` — `docker build` + `docker run` (mounting a
  volume for the SQLite file so data survives container restarts)
- `scripts/stop.sh` / `stop.bat` — `docker stop`/`rm` the container

## Build Steps
1. Move current root-level Next app into `frontend/`; remove `proxy.ts`,
   `app/api/*`, `lib/auth.ts`, `lib/board.ts`
2. Scaffold `backend/` with `uv` (`pyproject.toml`), FastAPI app skeleton,
   SQLAlchemy models, DB init-on-startup
3. Implement hardcoded 5-user auth + signed session cookie
4. Implement board `GET`/`PUT`, scoped per authenticated user, lazy board
   creation with seed data
5. Update frontend: client-fetch board data with 401→`/login` redirect, drop
   `owner` field, render pinned "Next steps" through the normal column path
6. Add `ConfirmDialog`; wire into account/column/entry delete
7. Set `next.config.ts` to static export; verify FastAPI serves `frontend/out/`
8. Write backend pytest suite
9. Write Playwright e2e suite against a disposable test DB
10. Write Dockerfile + `scripts/` start/stop for Mac/PC/Linux
11. Manual pass: build the image, run the container, log in as each of the 5
    users, confirm board isolation, exercise the full feature set including
    dialogs, confirm SQLite data survives a container restart

## Out of Scope (per CLAUDE.md Limitations)
- Self-signup or password changes
- More than one board per user
- Cloud deployment
