const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

let app;
let db;

describe('Dashboard stats and sorting', () => {
  before(async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/todo-test-dashboard';
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';

    app = require('../server');
    db = await mongoose.connect('mongodb://127.0.0.1:27017/todo-test-dashboard');
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  async function register(email) {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Stats User' });
    return res.body.token;
  }

  it('reports stats that match the real task list', async () => {
    const token = await register('stats-' + Date.now() + '@example.com');
    const auth = { Authorization: `Bearer ${token}` };

    // 1 genuinely overdue, 1 due today, 1 due far in the future, 1 with no
    // due date, 1 already completed.
    await request(app).post('/tasks').set(auth)
      .send({ title: 'Overdue', priority: 'high', dueDate: '2020-01-01' });
    const today = new Date().toISOString().slice(0, 10);
    await request(app).post('/tasks').set(auth)
      .send({ title: 'Due today', priority: 'medium', dueDate: today });
    await request(app).post('/tasks').set(auth)
      .send({ title: 'Future', priority: 'low', dueDate: '2099-01-02' });
    await request(app).post('/tasks').set(auth)
      .send({ title: 'No date', priority: 'low' });
    await request(app).post('/tasks').set(auth)
      .send({ title: 'Done', priority: 'high', status: 'completed' });

    const dash = await request(app).get('/tasks/dashboard').set(auth);
    assert.equal(dash.status, 200);

    assert.equal(dash.body.total, 5);
    assert.equal(dash.body.pending, 4);
    assert.equal(dash.body.completed, 1);
    // Only the past-due task counts: tasks due today and tasks without a due
    // date are not overdue.
    assert.equal(dash.body.overdue, 1);
    // Priority buckets must be real counts, not per-document placeholders.
    assert.deepEqual(dash.body.byPriority, { low: 2, medium: 1, high: 2 });

    // Stats must agree with what the list endpoint actually returns.
    const pendingList = await request(app).get('/tasks?status=pending').set(auth);
    assert.equal(pendingList.body.items.length, dash.body.pending);

    const completedList = await request(app).get('/tasks?status=completed').set(auth);
    assert.equal(completedList.body.items.length, dash.body.completed);
  });

  it('clearing a due date stores null instead of an invalid date', async () => {
    const token = await register('due-' + Date.now() + '@example.com');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app).post('/tasks').set(auth)
      .send({ title: 'Temp', dueDate: '2099-05-05' });
    assert.equal(created.status, 201);

    const res = await request(app)
      .patch(`/tasks/${created.body.id}`)
      .set(auth)
      .send({ dueDate: '' });

    assert.equal(res.status, 200);
    assert.equal(res.body.dueDate, null);
  });

  it('sorts by priority high > medium > low in both directions', async () => {
    const token = await register('sort-' + Date.now() + '@example.com');
    const auth = { Authorization: `Bearer ${token}` };

    await request(app).post('/tasks').set(auth).send({ title: 'Low one', priority: 'low' });
    await request(app).post('/tasks').set(auth).send({ title: 'High one', priority: 'high' });
    await request(app).post('/tasks').set(auth).send({ title: 'Medium one', priority: 'medium' });
    await request(app).post('/tasks').set(auth).send({ title: 'High two', priority: 'high' });

    const desc = await request(app)
      .get('/tasks?sortBy=priority&sortDirection=desc')
      .set(auth);
    assert.equal(desc.status, 200);
    assert.deepEqual(
      desc.body.items.map((t) => t.priority),
      ['high', 'high', 'medium', 'low']
    );

    const asc = await request(app)
      .get('/tasks?sortBy=priority&sortDirection=asc')
      .set(auth);
    assert.equal(asc.status, 200);
    assert.deepEqual(
      asc.body.items.map((t) => t.priority),
      ['low', 'medium', 'high', 'high']
    );
  });
});
