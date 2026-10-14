const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    createdAt: {
      type: Date,
      immutable: true,
      default: Date.now,
    },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
