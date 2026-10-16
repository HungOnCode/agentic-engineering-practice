# API conventions: adding a new endpoint

How to add a new endpoint to the Taskr API. These conventions describe the layout **after the refactor**, under `src/`. If `src/routes/` and `src/services/` don't exist yet, stop and ask the user before creating them. Don't fall back to adding the route to the root `routes.js`.

## The rules

1. **One route file per resource, in `src/routes/`.** The filename is the resource name in lowercase plural: `src/routes/comments.js`, `src/routes/tags.js`.
2. **Each route file exports a named Express Router.** Name it `<resource>Router` and export it by name: `module.exports = { commentsRouter }`. Don't use a default export.
3. **Handlers contain no business logic.** Each handler reads its inputs from `req`, calls the matching function in `src/services/`, and sends the response. SQL, validation rules and side effects (such as sending email) belong in the service.
4. **Errors go to `next` as a `{ status, message }` object.** Don't send error responses from the handler with `res.status(...).json(...)`. The shared error handler turns the object into the response.
5. **Register every router in `src/index.js`** with `app.use('/<resource>', <resource>Router)`, placed before the error handler.

## Example: a `comments` resource

`src/routes/comments.js`:

```js
const express = require('express');
const commentsService = require('../services/comments');

const commentsRouter = express.Router();

commentsRouter.get('/:id', async (req, res, next) => {
  try {
    const comment = await commentsService.getCommentById(parseInt(req.params.id));
    if (!comment) return next({ status: 404, message: 'Comment not found' });
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

commentsRouter.post('/', async (req, res, next) => {
  try {
    const comment = await commentsService.createComment(req.body);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = { commentsRouter };
```

`src/services/comments.js`. The service does the validation and database work, and signals failure by throwing a `{ status, message }` object, which the handler passes on to `next`:

```js
const { db } = require('../db');

function getCommentById(id) {
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

function createComment({ task_id, user_id, body }) {
  if (typeof body !== 'string' || !body.trim()) {
    throw { status: 400, message: 'body is required' };
  }
  // ...existence checks, INSERT, SELECT...
}

module.exports = { getCommentById, createComment };
```

`src/index.js`:

```js
const { commentsRouter } = require('./routes/comments');

app.use('/comments', commentsRouter);
// ...other routers...
app.use(errorHandler); // always last
```

## Things to know

- **Paths inside a router are relative to its mount point.** With `app.use('/comments', commentsRouter)`, `commentsRouter.get('/:id')` serves `GET /comments/:id`.
- **Service files** are named after their resource too (`src/services/comments.js`), so each route file maps to exactly one service file.
- **Nested resources** (such as `/tasks/:id/comments`) need `express.Router({ mergeParams: true })` so the router can read `req.params.id` from the parent path.
- **The error handler** currently lives in `middleware.js` and already reads `err.status` and `err.message`, so a plain `{ status, message }` object works. It falls back to a 500 when `status` is missing.
- **Add tests** in `tests/<resource>.test.js` (see `CLAUDE.md`).
