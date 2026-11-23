const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pool = require('./db/pool');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check: confirms the API and DB are reachable
app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    next(err);
  }
});

// Routes will be added here in the next steps

app.use(notFound);
app.use(errorHandler);

module.exports = app;