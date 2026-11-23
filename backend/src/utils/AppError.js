class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;   // HTTP status (400, 401, 404...)
    this.code = code;       // machine-readable code ('VALIDATION_ERROR'...)
    this.details = details; // optional extra info (field errors)
  }
}

module.exports = AppError;