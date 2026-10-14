const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { connectDb } = require('./config/db');
const authRouter = require('./routes/auth');
const tasksRouter = require('./routes/tasks');
const { errorHandler } = require('./middleware/error');

const app = express();

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
app.use(express.json({ limit: '16kb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'todo-server', node: process.version });
});

// API routes
app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);

// 404 for unknown API routes
app.use((req, res, next) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not Found' } });
});

// Centralized error handler
app.use(errorHandler);

const start = async () => {
  try {
    await connectDb();
    console.log(`[server] connected to MongoDB`);
  } catch (err) {
    console.error('[server] failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] todo-api listening on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = app;
