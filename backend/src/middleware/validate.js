const AppError = require('../utils/AppError');

// Validates req.body against a Zod schema
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', details));
    }
    req.body = result.data; // cleaned data (trimmed etc.)
    next();
  };
}

module.exports = { validateBody };