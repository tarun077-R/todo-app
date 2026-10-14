const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

let app;
let db;

describe('Validation API', () => {
  before(async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/todo-test-validate';
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';

    app = require('../server');
    db = await mongoose.connect('mongodb://127.0.0.1:27017/todo-test-validate');
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  async function register(email, password = 'password123') {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password, name: 'Validation User' });
    return res.body.token;
  }

  it('returns 400 when creating a task with missing title', async () => {
    const token = await register('val-' + Date.now() + '@example.com');

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'no title' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.fields.some((f) => f.field === 'title'));
  });

  it('returns 400 for an invalid priority', async () => {
    const token = await register('val-' + Date.now() + '-2@example.com');

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Task', priority: 'urgent' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});
