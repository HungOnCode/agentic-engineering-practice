# Testing standards: writing tests for the Taskr API

How to write tests for the Taskr API.

## The rules

1. **Name test files `<resource>.test.js`, in lowercase**, inside `tests/`: `tasks.test.js`, `comments.test.js`, `tags.test.js`. Don't copy the older styles (`userTest.js`, `test-projects.js`); they're scheduled for renaming.
2. **Use Jest and supertest against an in-memory SQLite database.** Tests must never need a running server, a `taskr.db` file, a seed step or any external service.
3. **For every endpoint, cover the happy path and at least two error cases.** Good error cases are a missing or invalid field (400), an unknown id (404), a duplicate (409), and a missing or wrong API key on protected routes (401).
4. **Write test descriptions in plain English, describing what the endpoint does**, not how it's implemented.
5. **`npm test` must run the whole suite with no other setup** beyond `npm install`. Don't add steps that depend on environment variables, seed scripts, files on disk or the order tests run in.

## File template

```js
process.env.NODE_ENV = 'test'; // must come before requiring the app: it makes DB.js use :memory:

const request = require('supertest');
const app = require('../index');
const { db } = require('../DB');
const { createSchema } = require('./schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  // Clear child tables before parents: foreign keys are enforced
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  // Insert only the rows this file needs
  db.prepare('INSERT INTO users (id, name, email) VALUES (1, ?, ?)').run('Test User', 'test@example.com');
});

describe('POST /comments', () => {
  test('adds a comment to a task', async () => {
    // happy path
  });

  test('rejects a comment with no body', async () => {
    // 400
  });

  test('rejects a comment on a task that does not exist', async () => {
    // 404
  });
});
```

- Use one `describe` block per endpoint, named `METHOD /path`.
- Send requests through `request(app)`. Don't call `app.listen()`.
- Set up data directly with `db.prepare(...)` when that's simpler than going through the API. Check results through the API's responses.
- Each test must pass when run on its own (`npx jest -t "<description>"`). Don't depend on data left behind by an earlier test.
- Protected routes take the header `.set('x-api-key', 'dev-key')`.
- After the refactor, the app and database imports move under `src/` (for example `require('../src/index')`). Use whatever paths exist at the time.

## Writing descriptions

Describe what a client of the API would see.

| Good | Bad |
|---|---|
| `lists only completed tasks when filtered by status` | `passes status to getTasks()` |
| `rejects a task with no title` | `returns 400 when isNonEmptyString fails` |
| `does not let someone without an API key delete a project` | `authenticate middleware calls res.status(401)` |
| `records when a task was completed` | `sets completed_at via new Date().toISOString()` |

Assert on status codes and response bodies, not on internals.

## Before finishing

- Run `npm test` and confirm the whole suite passes, not just the new file.
- If an endpoint has fewer than two realistic error cases, tell the user. Don't invent tests for cases that can't happen.
- If you changed the schema, update `tests/schema.js` as well as `db/seed.js`.
