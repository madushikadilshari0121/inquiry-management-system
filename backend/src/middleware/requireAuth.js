const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const AppError = require('../utils/AppError');

async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue'));
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again'));
  }

  // Load the user fresh from the DB, so a deleted user can't keep using an old token
  const { rows } = await pool.query(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [payload.sub]
  );
  if (rows.length === 0) {
    return next(new AppError(401, 'UNAUTHENTICATED', 'Account no longer exists'));
  }

  req.user = rows[0];
  next();
}

module.exports = requireAuth;