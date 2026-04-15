/**
 * @fileoverview Controller for user authentication.
 * Handles email/password registration and login with bcrypt password hashing.
 * JWT tokens stored in httpOnly cookies for session persistence.
 */
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Ensure the users table exists (auto-create on first use).
 */
async function ensureUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(255),
      display_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(sql);
}

// Initialize users table
ensureUsersTable().catch(err => console.error('Failed to create users table:', err));

/**
 * Generate JWT token and set httpOnly cookie.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, display_name: user.display_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Register a new user with email and password.
 * Password is hashed with bcrypt (10 salt rounds).
 */
async function register(email, password, displayName) {
  // Check if user exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name',
    [email, passwordHash, displayName || email.split('@')[0]]
  );

  return result.rows[0];
}

/**
 * Login with email and password.
 * Verifies password against bcrypt hash.
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
    const err = new Error('This account uses social login. Please sign in with Google.');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return { id: user.id, email: user.email, display_name: user.display_name };
}

/**
 * Find or create user from Google OAuth profile.
 */
async function findOrCreateGoogleUser(profile) {
  const email = profile.emails?.[0]?.value;
  const googleId = profile.id;
  const displayName = profile.displayName;

  // Check if user exists by google_id or email
  let result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1 OR email = $2',
    [googleId, email]
  );

  if (result.rows.length > 0) {
    // Update google_id if not set
    if (!result.rows[0].google_id) {
      await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, result.rows[0].id]);
    }
    return result.rows[0];
  }

  // Create new user
  result = await pool.query(
    'INSERT INTO users (email, google_id, display_name) VALUES ($1, $2, $3) RETURNING *',
    [email, googleId, displayName]
  );

  return result.rows[0];
}

module.exports = { register, login, generateToken, findOrCreateGoogleUser };
