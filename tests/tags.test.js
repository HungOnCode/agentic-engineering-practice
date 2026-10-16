process.env.NODE_ENV = 'test';

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
  db.prepare('INSERT INTO users (id, name, email) VALUES (1, ?, ?)').run('Test User', 'test@example.com');
  db.prepare('INSERT INTO tasks (id, title) VALUES (1, ?)').run('Test Task');
});

describe('GET /tags', () => {
  test('lists tags in alphabetical order', async () => {
    db.prepare("INSERT INTO tags (name) VALUES ('urgent'), ('bug'), ('frontend')").run();
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(res.body.map(t => t.name)).toEqual(['bug', 'frontend', 'urgent']);
  });

  test('returns an empty list when there are no tags', async () => {
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /tags', () => {
  test('creates a tag, stored in lowercase without surrounding spaces', async () => {
    const res = await request(app).post('/tags').send({ name: '  Urgent ' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('urgent');
  });

  test('rejects a tag with no name', async () => {
    const res = await request(app).post('/tags').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name is required');
  });

  test('rejects a tag whose name is only whitespace', async () => {
    const res = await request(app).post('/tags').send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name is required');
  });

  test('rejects a tag that already exists, ignoring case', async () => {
    db.prepare("INSERT INTO tags (name) VALUES ('urgent')").run();
    const res = await request(app).post('/tags').send({ name: 'URGENT' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('tag already exists');
  });
});

describe('POST /tasks/:id/tags', () => {
  beforeEach(() => {
    db.prepare("INSERT INTO tags (id, name) VALUES (1, 'urgent')").run();
  });

  test('applies a tag to a task', async () => {
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ task_id: 1, tag_id: 1 });
  });

  test('returns 404 for a task that does not exist', async () => {
    const res = await request(app).post('/tasks/999/tags').send({ tag_id: 1 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Task not found');
  });

  test('rejects a request with no tag_id', async () => {
    const res = await request(app).post('/tasks/1/tags').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('tag_id is required');
  });

  test('returns 404 for a tag that does not exist', async () => {
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 999 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Tag not found');
  });

  test('rejects applying the same tag to a task twice', async () => {
    db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1)').run();
    const res = await request(app).post('/tasks/1/tags').send({ tag_id: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('tag already applied to this task');
  });
});

describe('DELETE /tasks/:id/tags/:tagId', () => {
  beforeEach(() => {
    db.prepare("INSERT INTO tags (id, name) VALUES (1, 'urgent')").run();
  });

  test('removes a tag from a task', async () => {
    db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1)').run();
    const res = await request(app).delete('/tasks/1/tags/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });

    const task = await request(app).get('/tasks/1');
    expect(task.body.tags).toEqual([]);
  });

  test('returns 404 when the tag is not applied to the task', async () => {
    const res = await request(app).delete('/tasks/1/tags/1');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Tag not applied to this task');
  });
});

describe('GET /tasks/:id', () => {
  test('includes the task\'s tags and comments', async () => {
    db.prepare("INSERT INTO tags (id, name) VALUES (1, 'urgent')").run();
    db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (1, 1)').run();
    db.prepare("INSERT INTO comments (task_id, user_id, body) VALUES (1, 1, 'On it')").run();
    const res = await request(app).get('/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([{ id: 1, name: 'urgent' }]);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].body).toBe('On it');
    expect(res.body.comments[0].user_name).toBe('Test User');
  });
});
