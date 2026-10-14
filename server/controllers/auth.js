const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function register(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'email, password and name are required',
        fields: [{ field: 'credential', message: 'email, password and name are required' }],
      },
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A user with that email already exists',
      },
    });
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
  });

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '14d',
  });

  res.status(201).json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'email and password are required',
      },
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      },
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  if (!ok) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      },
    });
  }

  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '14d',
  });

  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
}

async function getMe(req, res) {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  }

  res.json({ user });
}

module.exports = { register, login, getMe };
