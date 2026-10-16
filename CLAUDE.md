# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Taskr — a REST API for task management (users, projects, tasks, comments, tags). Node.js + Express 5 + SQLite (`better-sqlite3`, synchronous API) + Jest/supertest.

## Context files

Read the matching file before starting these tasks:

- **Any task involving API routes or endpoints** → `.claude/context/api-conventions.md`
- **Any task involving tests or test coverage** → `.claude/context/testing-standards.md`

## Current state: intentional structural problems

This is an agentic-engineering practice repo. Its structural problems are **intentional** and will be fixed in a planned refactor. Many inline comments and TODOs name them. Learn the current state so you can work in it, but **don't copy the bad patterns into new code**, and don't do drive-by refactors during unrelated tasks; the refactor is separate work.

Patterns that exist today and should not be extended:

- **Monolithic `routes.js`** with inline validation and raw SQL in handlers. New routes go in dedicated route files (see "Never do these things"). Put queries and business rules in a separate module (the way `UserController.js` and `get-tasks.js` already do), and keep handlers thin.
- **Misplaced helpers**: query functions in `DB.js`, helper functions in `misc/constants.js`, two copies of `getUserById`. Reuse the existing helper or put new code where it belongs; don't add another copy.
- **Circular dependency** between `routes.js` and `projectHelpers.js`. Don't make helper modules import from `routes.js`.
- **Side effects inside controllers** (`createUser` sends an email). Don't add more of these.
- **Inconsistent naming**: mixed-case files (`DB.js`, `UserController.js`, `get-tasks.js`), and test files named `userTest.js` and `test-projects.js`. New files should be kebab-case; for test files, see "Schema & tests".
- **Inconsistent auth**: most write routes have no `authenticate`. New destructive routes should use it.
- **Dead code**: everything in `misc/` is scheduled for removal (see "Never do these things").
- **Duplicated pagination**: `GET /tasks` does pagination inline, and a separate `paginate()` sits in `misc/constants.js`. Don't write pagination inline a third time; put shared pagination logic in a proper module outside `misc/`.

If a task can't be done well without touching one of these, say so; don't quietly work around it.

## Never do these things

- **Never add new route logic to `routes.js`.** It's already too large. New routes belong in dedicated route files.
- **Never add a new utility function to `utils.js` without first checking whether it belongs in a more specific module.**
- **Never import from files in `misc/`.** That code is dead and scheduled for removal. Exception: `misc/constants.js` is still imported by `index.js` and `routes.js` (for `PORT` and `VALID_TASK_STATUSES`). Leave those existing imports alone until the refactor moves the file, but don't add new imports from it.

## Commands

```bash
npm install
npm run db:seed          # create schema + sample data in ./taskr.db (no-op if users already exist)
npm run db:reset         # delete taskr.db and re-seed
npm run dev              # node --watch index.js, port 3000 (PORT env overrides)
npm start
npm test                 # all Jest suites
npx jest tests/tasks.test.js           # one file
npx jest -t "filters by ?status=active" # one test by name
```

Health check: `GET http://localhost:3000/health`.

## Architecture

- `index.js` builds the Express app, mounts `routes.js`, and only calls `listen()` when run directly — tests `require('../index')` and drive it with supertest. `GET /` and `POST /webhooks/task-update` live in `index.js`, not in `routes.js`.
- `routes.js` holds every other route in one router. Handlers do inline validation and raw SQL via `db.prepare(...)`, **except users**, which delegate to `UserController.js` (which throws errors carrying `err.status`). Task reads go through `get-tasks.js`; project stats come from `projectHelpers.js`.
- `DB.js` exports a single shared `db` connection. `NODE_ENV=test` switches it to `:memory:`; otherwise `DB_PATH` or `taskr.db`. Foreign keys are enforced, and FKs have no `ON DELETE` rules, so deleting a referenced user/project errors.
- Circular dependency: `projectHelpers.js` ↔ `routes.js`. `routes.js` requires `projectHelpers` lazily inside the handler; keep it that way (or remove the cycle) when touching either file.
- Auth (`auth.js`): `x-api-key` header must equal `API_KEY` env (default `dev-key`). Only applied to `DELETE /users/:id` and `DELETE /projects/:id`.
- `sendEmail.js` is a console-logging stub; `UserController.createUser` awaits it.
- `misc/oldRoutes.js` and `misc/temp.js` are dead code (not imported). `misc/constants.js` holds `VALID_TASK_STATUSES` (`active|completed|archived`, also enforced by a DB CHECK constraint).

## Schema & tests

- The schema is defined **twice**: `db/seed.js` (real DB) and `tests/schema.js` (tests). Any schema change must be made in both.
- Each test file sets `NODE_ENV=test` before requiring the app, creates the schema in `beforeAll`, and wipes all tables in `beforeEach`.
- **Test files are named `<resource>.test.js`** (e.g. `tasks.test.js`, `comments.test.js`). Right now `tests/` mixes three styles (`tasks.test.js`, `userTest.js`, `test-projects.js`). That's a known problem and will be standardised in the refactor. Name every new test file `<resource>.test.js`, and don't copy the other two styles.
- Jest only picks up files matching the explicit `testMatch` list in `package.json` (`tests/*.test.js`, `tests/userTest.js`, `tests/test-projects.js`). A file named any other way won't run.
