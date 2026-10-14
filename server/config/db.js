const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  const opts = {
    autoCreate: false,
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  };

  if (process.env.NODE_ENV === 'test') {
    opts.serverSelectionTimeoutMS = 2000;
  }

  const conn = await mongoose.connect(uri, opts);
  return conn.connection;
};

module.exports = { connectDb };
