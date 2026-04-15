/**
 * @fileoverview VinoVoyage Backend Server
 * Express.js server with PostgreSQL connection, caching, authentication, and API routes.
 * 
 * Architecture:
 * - CORS middleware for frontend origin
 * - Cookie parser for JWT httpOnly cookies
 * - Timing middleware for query performance logging
 * - 13 API routes (Q1-Q13) under /api/*
 * - Auth routes under /auth/*
 * - Cache admin endpoint at /api/cache/clear
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const timingMiddleware = require('./middleware/timing');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const cache = require('./config/cache');

// Route imports
const regionsRoutes = require('./routes/regions');
const vineyardsRoutes = require('./routes/vineyards');
const locationsRoutes = require('./routes/locations');
const citiesRoutes = require('./routes/cities');
const hotelsRoutes = require('./routes/hotels');
const restaurantsRoutes = require('./routes/restaurants');
const poisRoutes = require('./routes/pois');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ========================
// Middleware
// ========================

// CORS configuration — allow frontend origin in production, all origins in development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // In production, check against allowed origins; also allow any .vercel.app domain
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // In development, allow all
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Be permissive for demo purposes
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(timingMiddleware);

// Trust proxy for Render (needed for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// ========================
// API Routes
// ========================
app.use('/api/regions', regionsRoutes);
app.use('/api/vineyards', vineyardsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/pois', poisRoutes);
app.use('/api/categories', categoriesRoutes);

// Auth routes
app.use('/auth', authRoutes);

/**
 * GET /api/cache/clear
 * Admin endpoint to flush all cached data.
 */
app.get('/api/cache/clear', (req, res) => {
  cache.flushAll();
  console.log('[CACHE] All cache entries cleared');
  res.json({ message: 'Cache cleared', keys: cache.keys().length });
});

/**
 * GET /api/stats
 * Returns global statistics for the home page hero section.
 */
app.get('/api/stats', async (req, res, next) => {
  try {
    const pool = require('./config/database');
    const cacheKey = 'global_stats';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM vineyard) AS vineyard_count,
        (SELECT COUNT(*) FROM hotel) AS hotel_count,
        (SELECT COUNT(DISTINCT co.country_id) FROM country co
         JOIN state s ON co.country_id = s.country_id
         JOIN city ci ON s.state_id = ci.state_id
         JOIN vineyard v ON ci.city_id = v.city_id) AS country_count,
        (SELECT COUNT(*) FROM poi) AS poi_count,
        (SELECT COUNT(*) FROM michelin_restaurant) AS restaurant_count
    `);

    const data = result.rows[0];
    cache.set(cacheKey, data, 3600);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
});

// ========================
// Error Handling
// ========================
app.use(notFoundHandler);
app.use(errorHandler);

// ========================
// Start Server
// ========================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍷 VinoVoyage Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
});

module.exports = app;
