/**
 * @fileoverview Routes for authentication endpoints.
 * POST /auth/register — Register with email/password
 * POST /auth/login — Login with email/password
 * GET /auth/me — Get current user
 * POST /auth/logout — Logout (clear cookie)
 */
const express = require('express');
const router = express.Router();
const { register, login, generateToken } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /auth/register
 * Register a new user with email and password.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await register(email, password, displayName);
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ user: { id: user.id, email: user.email, display_name: user.display_name } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * Login with email and password.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await login(email, password);
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { id: user.id, email: user.email, display_name: user.display_name } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/me
 * Get current authenticated user info.
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

/**
 * POST /auth/logout
 * Clear the auth cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
