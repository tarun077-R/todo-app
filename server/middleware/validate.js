function validate(schema) {
  return (req, res, next) => {
    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const fields = result.error.errors.map((e) => ({
        field: e.path,
        message: e.message,
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          fields,
        },
      });
    }

    next();
  };
}

module.exports = { validate };
