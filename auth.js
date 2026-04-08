// src/routes/auth.js
const express   = require('express');
const { body, validationResult } = require('express-validator');
const authSvc   = require('../services/authService');
const router    = express.Router();

const COOKIE_NAME = 'lms_refresh';

function setCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge:   Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30) * 86_400_000,
    path:     '/api/auth',
  });
}

function validate(req, res, next) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ errors: errs.array() });
  next();
}

// POST /api/auth/register
router.post('/register',
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validate,
  async (req, res) => {
    try {
      const { user, accessToken, refreshToken } = await authSvc.register(req.body);
      setCookie(res, refreshToken);
      res.status(201).json({ user, accessToken });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res) => {
    try {
      const { user, accessToken, refreshToken } = await authSvc.login(req.body);
      setCookie(res, refreshToken);
      res.json({ user, accessToken });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const raw = req.cookies?.[COOKIE_NAME];
    const { user, accessToken, refreshToken } = await authSvc.refresh(raw);
    setCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const raw = req.cookies?.[COOKIE_NAME];
  await authSvc.logout(raw);
  res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
  res.json({ message: 'Logged out' });
});

module.exports = router;
