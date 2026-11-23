const express = require('express');
const { login, logout, me } = require('../controllers/authController');
const { validateBody } = require('../middleware/validate');
const { loginSchema } = require('../validation/authSchemas');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;