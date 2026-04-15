/**
 * @fileoverview Routes for city endpoints.
 * GET /api/cities/search — Search cities by name
 * GET /api/cities/:city_id/bundle — Q9
 */
const express = require('express');
const router = express.Router();
const { getCityBundle, searchCities } = require('../controllers/cities');
const { parseIntParam, parseStringParam } = require('../middleware/validate');

/**
 * GET /api/cities/search
 * Search cities by name for the trip planner.
 * @query {string} q - Search query
 */
router.get('/search', async (req, res, next) => {
  try {
    const q = parseStringParam(req.query.q);
    if (!q) return res.status(400).json({ error: 'q parameter is required' });
    const limit = parseIntParam(req.query.limit, 20, 1, 50);
    const data = await searchCities(q, limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cities/:city_id/bundle
 * Q9 (Complex) — City Trip Planner Bundle
 * @param {number} city_id - City ID
 * @query {number} min_rating - Minimum hotel rating (1-5)
 */
router.get('/:city_id/bundle', async (req, res, next) => {
  try {
    const cityId = parseIntParam(req.params.city_id, 0, 1, 999999);
    if (cityId === 0) return res.status(400).json({ error: 'Invalid city_id' });
    const minRating = req.query.min_rating ? parseIntParam(req.query.min_rating, null, 1, 5) : null;
    const data = await getCityBundle(cityId, minRating);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
