/**
 * @fileoverview Routes for vineyard endpoints.
 * GET /api/vineyards — Q2
 * GET /api/vineyards/:vineyard_id — Single vineyard detail
 * GET /api/vineyards/:vineyard_id/hotels — Q4
 * GET /api/vineyards/:vineyard_id/pois — Q5
 * GET /api/vineyards/:vineyard_id/restaurants — Q6
 */
const express = require('express');
const router = express.Router();
const {
  searchVineyards, getVineyardById,
  getNearbyHotels, getNearbyPois, getNearbyRestaurants,
} = require('../controllers/vineyards');
const { parseIntParam, parseFloatParam, parseStringParam } = require('../middleware/validate');

/**
 * GET /api/vineyards
 * Q2 — Search Vineyards with Filters
 */
router.get('/', async (req, res, next) => {
  try {
    const params = {
      country: parseStringParam(req.query.country),
      state: parseStringParam(req.query.state),
      city: parseStringParam(req.query.city),
      name: parseStringParam(req.query.name),
      limit: parseIntParam(req.query.limit, 20, 1, 100),
      offset: parseIntParam(req.query.offset, 0, 0, 100000),
    };
    const data = await searchVineyards(params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vineyards/:vineyard_id
 * Single vineyard detail
 */
router.get('/:vineyard_id', async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.vineyard_id, 0, 1, 999999);
    if (id === 0) return res.status(400).json({ error: 'Invalid vineyard_id' });
    const data = await getVineyardById(id);
    if (!data) return res.status(404).json({ error: 'Vineyard not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vineyards/:vineyard_id/hotels
 * Q4 (Complex) — Nearby Hotels Ranked by Rating Within Radius
 */
router.get('/:vineyard_id/hotels', async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.vineyard_id, 0, 1, 999999);
    if (id === 0) return res.status(400).json({ error: 'Invalid vineyard_id' });
    const radius = parseFloatParam(req.query.radius, 50, 1, 500);
    const data = await getNearbyHotels(id, radius);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vineyards/:vineyard_id/pois
 * Q5 — Nearby POIs by Category
 */
router.get('/:vineyard_id/pois', async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.vineyard_id, 0, 1, 999999);
    if (id === 0) return res.status(400).json({ error: 'Invalid vineyard_id' });
    const radius = parseFloatParam(req.query.radius, 50, 1, 500);
    const data = await getNearbyPois(id, radius);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vineyards/:vineyard_id/restaurants
 * Q6 — Nearby Michelin Restaurants
 */
router.get('/:vineyard_id/restaurants', async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.vineyard_id, 0, 1, 999999);
    if (id === 0) return res.status(400).json({ error: 'Invalid vineyard_id' });
    const radius = parseFloatParam(req.query.radius, 50, 1, 500);
    const data = await getNearbyRestaurants(id, radius);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
