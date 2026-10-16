# API conventions: adding a new endpoint

How to add a new endpoint to the Taskr API. Code lives under `src/` in three layers: **routes → services → queries**.

## The rules

1. **One route file per resource, in `src/routes/`.** The filename is the resource name in lowercase plural, kebab-case for multiple words: `src/routes/comments.js`, `src/routes/task-tags.js`.
2. **Each route file exports a named Express Router.** Name it `<resource>Router` and export it by name: `module.exports = { commentsRouter }`. Don't use a default export.
3. **Handlers contain no business logic.** Each handler reads its inputs from `req`, calls the matching function in `src/services/`, and sends the response. Validation rules and side effects (such as sending email) belong in the service.
4. **Services never touch the database directly.** They call functions in `src/db/queries/`, which is the only place SQL lives.
5. **Errors go to `next`.** Services throw a `{ status, message }` object; handlers catch it and pass it to `next(err)`. Don't send error responses from the handler with `res.status(...).json(...)`. The shared error handler turns the object into the response.
6. **Register every router in `src/index.js`** with `app.use('/<resource>', <resource>Router)`, placed before the error handler.

## Example: a `comments` resource

`src/routes/comments.js`:

```js
const express = require('express');
const commentsService = require('../services/comments');

// Mounted at /tasks/:id/comments; mergeParams exposes the parent :id
const commentsRouter = express.Router({ mergeParams: true });

commentsRouter.post('/', (req, res, next) => {
  try {
    const comment = commentsService.createComment(parseInt(req.params.id), req.body);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = { commentsRouter };
```

`src/services/comments.js`. The service validates input and applies the rules, then calls queries:

```js
const commentsQueries = require('../db/queries/comments');
const tasksQueries = require('../db/queries/tasks');
const { isNonEmptyString } = require('../utils/validation');

function createComment(taskId, { user_id, body }) {
  if (!tasksQueries.findTaskById(taskId)) throw { status: 404, message: 'Task not found' };
  if (!isNonEmptyString(body)) throw { status: 400, message: 'body is required' };
  // ...more checks...
  const id = commentsQueries.insertComment({ task_id: taskId, user_id: parseInt(user_id), body });
  return commentsQueries.findCommentById(id);
}

module.exports = { createComment };
```

`src/db/queries/comments.js`. Thin wrappers around SQL:

```js
const { db } = require('../index');

function insertComment({ task_id, user_id, body }) {
  return db.prepare(
    'INSERT INTO comments (task_id, user_id, body) VALUES (?, ?, ?)'
  ).run(task_id, user_id, body).lastInsertRowid;
}

module.exports = { insertComment };
```

`src/index.js`:

```js
const { commentsRouter } = require('./routes/comments');

app.use('/tasks/:id/comments', commentsRouter);
// ...other routers...
app.use(errorHandler); // always last
```

## Things to know

- **Paths inside a router are relative to its mount point.** With `app.use('/tags', tagsRouter)`, `tagsRouter.get('/')` serves `GET /tags`.
- **Service files** are named after their resource (`src/services/comments.js`), so each route file maps to one service file. A service can also use shared services such as `services/email.js`.
- **Query files** are grouped by table (`src/db/queries/tags.js` also holds the `task_tags` queries). Reuse existing queries before adding new ones.
- **Nested resources** (such as `/tasks/:id/comments`) need `express.Router({ mergeParams: true })` so the router can read `req.params.id` from the parent path. Mount them before `/tasks` in `src/index.js`.
- **Duplicates.** Catch the insert error and test it with `isUniqueViolation(err)` from `src/utils/sqlite-errors.js`, then throw a 409.
- **Destructive routes** should use `authenticate` from `src/middleware/auth.js`.
- **The error handler** lives in `src/middleware/error-handler.js`. It reads `err.status` and `err.message`, falls back to a 500 when `status` is missing, and logs only 5xx errors.
- **Add tests** in `tests/<resource>.test.js` (see `testing-standards.md`).
