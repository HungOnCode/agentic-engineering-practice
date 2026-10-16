process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { db } = require('../DB');
const { createSchema } = require('./schema');

beforeAll(() => {
  createSchema(db);
});

describe('GET /', () => {
  test('describes the API', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Taskr API', version: '1.0.0', docs: '/health' });
  });
});

describe('GET /health', () => {
  test('reports that the API is up, with the current time', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});

describe('POST /webhooks/task-update', () => {
  test('acknowledges the webhook', async () => {
    const res = await request(app)
      .post('/webhooks/task-update')
      .send({ task_id: 1, status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});

describe('Malformed requests', () => {
  test('rejects a body that is not valid JSON', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
