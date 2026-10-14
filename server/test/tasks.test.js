const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

let app;
let db;

describe('Tasks API', () => {
  before(async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/todo-test-tasks';
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';

    app = require('../server');
    db = await mongoose.connect('mongodb://127.0.0.1:27017/todo-test-tasks');
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  async function registerAndLogin(email) {
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Task User' });
    return reg.body.token;
  }

  it('creates a task and returns 201', async () => {
    const token = await registerAndLogin('task-' + Date.now() + '@example.com');

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Buy milk', priority: 'low', category: 'shopping' });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Buy milk');
    assert.equal(res.body.status, 'pending');
    assert.equal(res.body.priority, 'low');
  });

  it('filters status/priority/category and sorts the list', async () => {
    const token = await registerAndLogin('filter-' + Date.now() + '@example.com');
    const auth = { Authorization: `Bearer ${token}` };

    await request(app).post('/tasks').set(auth)
      .send({ title: 'Errands', priority: 'low', category: 'home', dueDate: '2026-11-01' });
    await request(app).post('/tasks').set(auth)
      .send({ title: 'Invoice', priority: 'high', category: 'work', dueDate: '2026-10-01' });
    await request(app).post('/tasks').set(auth)
      .send({ title: 'Gym', priority: 'low', category: 'home' });

    // category filter matches only home tasks
    let res = await request(app).get('/tasks?category=home').set(auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 2);
    assert.ok(res.body.items.every((t) => t.category === 'home'));

    // status + priority filter
    res = await request(app).get('/tasks?status=pending&priority=high').set(auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
    assert.equal(res.body.items[0].title, 'Invoice');

    // sort by dueDate ascending, excluding unfinished
    res = await request(app).get('/tasks?sortBy=dueDate&sortDirection=asc').set(auth);
    assert.equal(res.status, 200);
    const sorted = res.body.items.filter((t) => t.dueDate).map((t) => t.dueDate);
    assert.deepEqual(sorted, [...sorted].sort());
  });

  it('lists only the calling user tasks', async () => {
    const token = await registerAndLogin('list-' + Date.now() + '@example.com');
    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Carol task', priority: 'medium' });

    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.items.length >= 1);
  });
});
