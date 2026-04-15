/**
 * @fileoverview Routes for authentication endpoints.
 * POST /auth/register — Register with email/password
 * POST /auth/login — Login with email/password
 * GET  /auth/me — Get current user
 * POST /auth/logout — Logout (clear cookie)
 * GET  /auth/google — Redirect to Google OAuth
 * GET  /auth/google/callback — Google OAuth callback
 * GET  /auth/github — Redirect to GitHub OAuth
 * GET  /auth/github/callback — GitHub OAuth callback
 */
const express = require('express');
const router = express.Router();
const { register, login, generateToken, findOrCreateGoogleUser, findOrCreateGithubUser } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

// Cookie options helper
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

// ========================
// Email/Password Auth
// ========================

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
    res.cookie('token', token, cookieOptions());
    res.status(201).json({ user: { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await login(email, password);
    const token = generateToken(user);
    res.cookie('token', token, cookieOptions());
    res.json({ user: { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ message: 'Logged out successfully' });
});

// ========================
// Google OAuth
// ========================

/**
 * GET /auth/google
 * Redirects user to Google OAuth consent screen.
 */
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const redirectUri = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/auth/google/callback`;
  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.redirect(url);
});

/**
 * GET /auth/google/callback
 * Exchanges authorization code for tokens, fetches user info, creates/finds user, sets JWT cookie, redirects to frontend.
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_error=no_code`);
    }

    const redirectUri = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[AUTH] Google token exchange failed:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_error=token_failed`);
    }

    // Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userRes.json();

    // Find or create user
    const user = await findOrCreateGoogleUser({
      googleId: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name,
      avatarUrl: userInfo.picture,
    });

    // Set JWT cookie and redirect to frontend
    const jwtToken = generateToken(user);
    res.cookie('token', jwtToken, cookieOptions());
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_success=google`);
  } catch (err) {
    console.error('[AUTH] Google OAuth error:', err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_error=server_error`);
  }
});

// ========================
// GitHub OAuth
// ========================

/**
 * GET /auth/github
 * Redirects user to GitHub OAuth authorization page.
 */
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  const redirectUri = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/auth/github/callback`;
  const scope = encodeURIComponent('read:user user:email');
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

  res.redirect(url);
});

/**
 * GET /auth/github/callback
 * Exchanges authorization code for access token, fetches user info, creates/finds user, sets JWT cookie, redirects to frontend.
 */
router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_error=no_code`);
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[AUTH] GitHub token exchange failed:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_error=token_failed`);
    }

    // Fetch user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });
    const userInfo = await userRes.json();

    // Fetch user email (may be private)
    let email = userInfo.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      });
      const emails = await emailRes.json();
      const primary = emails.find(e => e.primary) || emails[0];
      email = primary?.email || `${userInfo.login}@github.noemail`;
    }

    // Find or create user
    const user = await findOrCreateGithubUser({
      githubId: userInfo.id,
      email,
      displayName: userInfo.name || userInfo.login,
      avatarUrl: userInfo.avatar_url,
    });

    // Set JWT cookie and redirect to frontend
    const jwtToken = generateToken(user);
    res.cookie('token', jwtToken, cookieOptions());
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_success=github`);
  } catch (err) {
    console.error('[AUTH] GitHub OAuth error:', err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth_error=server_error`);
  }
});

module.exports = router;
