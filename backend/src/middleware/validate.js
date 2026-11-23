const AppError = require('../utils/AppError');

function toDetails(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

// Validates req.body against a Zod schema
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', toDetails(result.error)));
    }
    req.body = result.data;
    next();
  };
}

// Validates req.query (Express 5 doesn't allow overwriting req.query)
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters', toDetails(result.error)));
    }
    req.validatedQuery = result.data;
    next();
  };
}

module.exports = { validateBody, validateQuery };