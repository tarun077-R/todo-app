const mongoose = require('mongoose');
const Task = require('../models/Task');

async function create(req, res) {
  const { title, description, status, priority, dueDate, category } = req.body;

  if (!title || String(title).trim().length === 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'title is required',
        fields: [{ field: 'title', message: 'title is required' }],
      },
    });
  }

  try {
    const task = await Task.create({
      owner: req.user.id,
      title: title.trim(),
      description: description?.trim(),
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      category: category?.trim(),
    });

    res.status(201).json(sanitize(task));
  } catch (err) {
    if (err.name === 'ValidationError') {
      const fields = Object.entries(err.errors)
        .map(([key, value]) => ({ field: key, message: value.message }));
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          fields,
        },
      });
    }
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create task',
      },
    });
  }
}

async function list(req, res) {
  const { search, status, priority, category, sortBy, sortDirection, page = 1, limit = 50 } = req.query;

  const filter = { owner: req.user.id };
  if (search && String(search).trim()) {
    filter.title = new RegExp(String(search).trim(), 'i');
  }
  if (status === 'pending' || status === 'completed') {
    filter.status = status;
  }
  if (priority === 'low' || priority === 'medium' || priority === 'high') {
    filter.priority = priority;
  }
  if (category && String(category).trim()) {
    filter.category = String(category).trim();
  }

  const skips = (Number(page) - 1) * Number(limit);
  const dir = sortDirection === 'desc' ? -1 : 1;

  let tasks;
  let total;

  if (sortBy === 'priority') {
    // Priority orders high > medium > low, which is not alphabetical, so it
    // cannot be expressed as a plain Mongo sort on the string field. Fetch the
    // matching set (already created newest-first) and rank it in memory; Array
    // .sort is stable, so equal priorities keep their createdAt-desc order.
    const rank = { high: 3, medium: 2, low: 1 };
    const all = await Task.find(filter).sort({ createdAt: -1 });
    all.sort((a, b) => {
      const diff = (rank[a.priority] ?? 0) - (rank[b.priority] ?? 0);
      return dir === -1 ? -diff : diff;
    });
    tasks = all.slice(skips, skips + Number(limit));
    total = all.length;
  } else {
    const sort = {};
    if (sortBy === 'dueDate' || sortBy === 'createdAt') {
      sort[sortBy] = dir;
    } else {
      sort.createdAt = -1;
    }

    [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip(skips)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);
  }

  res.json({
    items: tasks.map(sanitize),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Math.max(Number(limit), 1)),
    },
  });
}

async function get(req, res) {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
  if (!task) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    });
  }

  res.json(sanitize(task));
}

async function update(req, res) {
  const { title, description, status, priority, dueDate, category } = req.body;
  const updates = {};

  if (title !== undefined) {
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description = description?.trim();
  }
  if (status !== undefined) {
    if (status !== 'pending' && status !== 'completed') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status must be pending or completed',
        },
      });
    }
    updates.status = status;
  }
  if (priority !== undefined) {
    if (priority !== 'low' && priority !== 'medium' && priority !== 'high') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'priority must be low, medium, or high',
        },
      });
    }
    updates.priority = priority;
  }
  if (dueDate !== undefined) {
    if (dueDate === null || dueDate === '') {
      // Clearing the date field must store null, not new Date('') (Invalid Date).
      updates.dueDate = null;
    } else {
      const parsed = new Date(dueDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'dueDate must be a valid date',
          },
        });
      }
      updates.dueDate = parsed;
    }
  }
  if (category !== undefined) {
    updates.category = category.trim();
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!task) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    });
  }

  res.json(sanitize(task));
}

async function remove(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!task) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    });
  }

  res.status(204).send();
}

async function complete(req, res) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { $set: { status: 'completed' } },
    { new: true }
  );

  if (!task) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    });
  }

  res.json(sanitize(task));
}

async function restore(req, res) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { $set: { status: 'pending' } },
    { new: true }
  );

  if (!task) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    });
  }

  res.json(sanitize(task));
}

async function search(req, res) {
  const { q } = req.query;
  if (!q || String(q).trim() === '') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'search query (q) is required',
      },
    });
  }

  const tasks = await Task.find({
    owner: req.user.id,
    title: new RegExp(String(q).trim(), 'i'),
  }).sort({ createdAt: -1 });

  res.json({ items: tasks.map(sanitize) });
}

async function filterList(req, res) {
  const { status, priority } = req.query;
  const filter = { owner: req.user.id };

  if (status === 'pending' || status === 'completed') {
    filter.status = status;
  }
  if (priority === 'low' || priority === 'medium' || priority === 'high') {
    filter.priority = priority;
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 });

  res.json({ items: tasks.map(sanitize) });
}

async function sortTasks(req, res) {
  const { sortBy = 'createdAt', order = 'desc' } = req.query;
  const allowed = ['createdAt', 'dueDate', 'priority', 'title'];
  const allowedOrder = ['asc', 'desc'];

  if (!allowed.includes(sortBy)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'sortBy must be one of createdAt, dueDate, priority, title',
      },
    });
  }

  if (!allowedOrder.includes(order)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'order must be asc or desc',
      },
    });
  }

  const sort = {};
  sort[sortBy] = order === 'desc' ? -1 : 1;

  const tasks = await Task.find({ owner: req.user.id }).sort(sort);

  res.json({ items: tasks.map(sanitize) });
}

async function dashboard(req, res) {
  // Aggregations never cast types: req.user.id is the hex string from the JWT
  // while owner is stored as an ObjectId, so match on a casted ObjectId or the
  // pipeline silently matches zero documents and every stat reads 0.
  const owner = mongoose.isValidObjectId(req.user.id)
    ? new mongoose.Types.ObjectId(String(req.user.id))
    : req.user.id;

  // "Overdue" means the due date is before *today*, not before this instant:
  // date-only due dates are stored at midnight, so comparing to now() would
  // mark every task due today as overdue (the UI shows them as "Today").
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const stats = await Task.aggregate([
    { $match: { owner } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'pending'] },
                  { $ne: [{ $type: '$dueDate' }, 'missing'] },
                  { $ne: ['$dueDate', null] },
                  { $lt: ['$dueDate', startOfToday] },
                ],
              },
              1,
              0,
            ],
          },
        },
        low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
      },
    },
  ]);

  res.json({
    total: stats[0]?.total || 0,
    completed: stats[0]?.completed || 0,
    pending: stats[0]?.pending || 0,
    overdue: stats[0]?.overdue || 0,
    byPriority: {
      low: stats[0]?.low || 0,
      medium: stats[0]?.medium || 0,
      high: stats[0]?.high || 0,
    },
  });
}

function sanitize(task) {
  return {
    id: task._id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    category: task.category,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

module.exports = {
  create,
  list,
  get,
  update,
  remove,
  complete,
  restore,
  search,
  filterList,
  sortTasks,
  dashboard,
};
