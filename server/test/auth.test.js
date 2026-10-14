const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

let app;
let db;

describe('Auth API', () => {
  before(async () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/todo-test-auth';
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';

    app = require('../server');
    db = await mongoose.connect('mongodb://127.0.0.1:27017/todo-test-auth');
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  async function register(email, password = 'password123', name = 'Test User') {
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password, name });
    return res.body.token;
  }

  it('registers a new user and issues a JWT', async () => {
    const email = 'alice-' + Date.now() + '@example.com';
    const token = await register(email, 'password123', 'Alice');

    assert.ok(token, 'register should return a JWT');
    const res = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Alice' });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'CONFLICT');
  });

  it('rejects a duplicate registration', async () => {
    const email = 'dup-' + Date.now() + '@example.com';

    const first = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Alice' });

    assert.equal(first.status, 201);

    const second = await request(app)
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Alice' });

    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, 'CONFLICT');
  });

  it('logs a user in with correct credentials', async () => {
    const email = 'login-' + Date.now() + '@example.com';
    await register(email, 'password123', 'Login User');

    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'password123' });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  it('rejects login with wrong password', async () => {
    const email = 'wrongpass-' + Date.now() + '@example.com';
    await register(email, 'password123', 'WrongPass User');

    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'wrong-password' });

    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});
