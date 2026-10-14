function errorHandler(err, req, res, _next) {
  const status = err.status || 500;

  if (status === 500) {
    console.error('[server] unhandled error:', err.message);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }

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

  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A user with that email already exists',
      },
    });
  }

  return res.status(status).json({
    error: {
      code: 'ERROR',
      message: err.message || 'Request failed',
    },
  });
}

module.exports = { errorHandler };
