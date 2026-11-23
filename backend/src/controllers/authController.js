const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const AppError = require('../utils/AppError');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours (match JWT_EXPIRES_IN)
};

async function login(req, res) {
  const { email, password } = req.body;

  const { rows } = await pool.query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

function logout(req, res) {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: undefined });
  res.status(204).end();
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, logout, me };