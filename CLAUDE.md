# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Taskr — a REST API for task management (users, projects, tasks, comments, tags). Node.js + Express 5 + SQLite (`better-sqlite3`, synchronous API) + Jest/supertest.

## Context files

Read the matching file before starting these tasks:

- **Any task involving API routes or endpoints** → `.claude/context/api-conventions.md`
- **Any task involving tests or test coverage** → `.claude/context/testing-standards.md`

## Folder structure

All source lives under `src/`, in layers. Each layer calls only the one directly below it:

**routes → services → queries → database connection** (`src/db/index.js`)

```
src/
  index.js          builds the app, mounts routers, listen() only when run directly
  config.js         PORT
  routes/           one Express router per resource, thin handlers
  services/         validation, business rules, side effects
  db/
    index.js        the shared better-sqlite3 connection ({ db })
    schema.js       createSchema(db), the single schema definition
    seed.js         sample data for ./taskr.db
    queries/        one file per table group; the only place SQL lives
  middleware/       auth, request-logger, error-handler
  utils/            validation, pagination, sqlite-errors
```

- **Routes** (`src/routes/<resource>.js`) export `{ <resource>Router }`. A handler reads `req`, calls one service function, sends the response, and passes errors to `next(err)`. Routes contain no SQL and no validation.
- **Services** (`src/services/<resource>.js`) do validation and business rules, and throw `{ status, message }` for expected errors. They call `src/db/queries/*` and never `db.prepare` directly. Side effects belong here, such as the welcome email (`services/email.js`, a console-logging stub).
- **Queries** (`src/db/queries/<table>.js`) import `{ db }` from `src/db/index.js` and are thin wrappers around `db.prepare(...)` with no HTTP knowledge. Reuse an existing query (for example `findUserById`) rather than writing another copy.
- **Error handler** (`src/middleware/error-handler.js`) sends `{ error: message }` with `err.status || 500`. It logs only 5xx errors.
- **Nested resources** (`/tasks/:id/comments`, `/tasks/:id/tags`) use `express.Router({ mergeParams: true })`. They're mounted in `src/index.js` before `/tasks`.
- **Duplicate-key detection** uses `isUniqueViolation(err)` from `src/utils/sqlite-errors.js`. It checks SQLite error codes, not message text.
- **Pagination** uses `getPagination(page, pageSize)` from `src/utils/pagination.js`. Don't write pagination inline.

Other facts:

- `src/db/index.js` uses `:memory:` when `NODE_ENV=test`; otherwise `DB_PATH` or `taskr.db`. Foreign keys are enforced, and FKs have no `ON DELETE` rules, so deleting a referenced user or project errors (500).
- Auth (`src/middleware/auth.js`): the `x-api-key` header must equal the `API_KEY` env (default `dev-key`). Today it's applied only to `DELETE /users/:id` and `DELETE /projects/:id`. New destructive routes should use it.
- Task statuses (`active|completed|archived`) are defined in `src/services/tasks.js` and enforced by a DB CHECK constraint.

## Naming conventions

- **All files use kebab-case**: `error-handler.js`, `task-tags.js`, `sqlite-errors.js`. No camelCase, PascalCase or snake_case file names.
- Route, service and query files are named after their resource in lowercase plural: `src/routes/tasks.js`, `src/services/tasks.js`, `src/db/queries/tasks.js`.
- Test files are named `<resource>.test.js`: `tests/tasks.test.js`.
- Exported routers are camelCase `<resource>Router`, for example `taskTagsRouter`.

## Commands

```bash
npm install
npm run db:seed          # create schema + sample data in ./taskr.db (no-op if users already exist)
npm run db:reset         # delete taskr.db and re-seed
npm run dev              # node --watch src/index.js, port 3000 (PORT env overrides)
npm start                # node src/index.js
npm test                 # all Jest suites
npx jest tests/tasks.test.js           # one file
npx jest -t "filters by ?status=active" # one test by name
```

Health check: `GET http://localhost:3000/health`.

## Schema & tests

- The schema is defined once, in `src/db/schema.js`. Both the seed script and the tests use it.
- Test files are named `<resource>.test.js`. Jest's `testMatch` is `tests/*.test.js`, so a file named any other way won't run.
- Each test file sets `NODE_ENV=test` before requiring `../src/index`, calls `createSchema(db)` in `beforeAll`, and wipes all tables in `beforeEach`.
