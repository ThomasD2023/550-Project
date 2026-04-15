/**
 * @fileoverview Controller for user authentication.
 * Handles email/password registration and login with bcrypt password hashing.
 * Supports Google OAuth and GitHub OAuth via manual token exchange.
 * JWT tokens stored in httpOnly cookies for session persistence.
 */
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Ensure the users table exists (auto-create on first use).
 * Includes columns for google_id and github_id for social login.
 */
async function ensureUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(255),
      github_id VARCHAR(255),
      display_name VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(sql);

  // Add github_id and avatar_url columns if they don't exist (migration)
  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$;
  `);
}

// Initialize users table
ensureUsersTable().catch(err => console.error('Failed to create users table:', err));

/**
 * Generate JWT token.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Register a new user with email and password.
 * Password is hashed with bcrypt (10 salt rounds).
 */
async function register(email, password, displayName) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, avatar_url',
    [email, passwordHash, displayName || email.split('@')[0]]
  );

  return result.rows[0];
}

/**
 * Login with email and password.
 */
async function login(email, password) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  if (!user.password_hash) {
    const err = new Error('This account uses social login. Please sign in with Google or GitHub.');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return { id: user.id, email: user.email, display_name: user.display_name, avatar_url: user.avatar_url };
}

/**
 * Find or create user from Google OAuth profile.
 * @param {Object} profile - { googleId, email, displayName, avatarUrl }
 */
async function findOrCreateGoogleUser(profile) {
  const { googleId, email, displayName, avatarUrl } = profile;

  // Check if user exists by google_id or email
  let result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1 OR email = $2',
    [googleId, email]
  );

  if (result.rows.length > 0) {
    const user = result.rows[0];
    // Update google_id and avatar if not set
    if (!user.google_id || !user.avatar_url) {
      await pool.query(
        'UPDATE users SET google_id = COALESCE(google_id, $1), avatar_url = COALESCE(avatar_url, $2), display_name = COALESCE(display_name, $3) WHERE id = $4',
        [googleId, avatarUrl, displayName, user.id]
      );
    }
    return { ...user, avatar_url: user.avatar_url || avatarUrl, display_name: user.display_name || displayName };
  }

  // Create new user
  result = await pool.query(
    'INSERT INTO users (email, google_id, display_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, googleId, displayName, avatarUrl]
  );

  return result.rows[0];
}

/**
 * Find or create user from GitHub OAuth profile.
 * @param {Object} profile - { githubId, email, displayName, avatarUrl }
 */
async function findOrCreateGithubUser(profile) {
  const { githubId, email, displayName, avatarUrl } = profile;

  // Check if user exists by github_id or email
  let result = await pool.query(
    'SELECT * FROM users WHERE github_id = $1 OR email = $2',
    [String(githubId), email]
  );

  if (result.rows.length > 0) {
    const user = result.rows[0];
    if (!user.github_id || !user.avatar_url) {
      await pool.query(
        'UPDATE users SET github_id = COALESCE(github_id, $1), avatar_url = COALESCE(avatar_url, $2), display_name = COALESCE(display_name, $3) WHERE id = $4',
        [String(githubId), avatarUrl, displayName, user.id]
      );
    }
    return { ...user, avatar_url: user.avatar_url || avatarUrl, display_name: user.display_name || displayName };
  }

  // Create new user
  result = await pool.query(
    'INSERT INTO users (email, github_id, display_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, String(githubId), displayName, avatarUrl]
  );

  return result.rows[0];
}

module.exports = { register, login, generateToken, findOrCreateGoogleUser, findOrCreateGithubUser };
