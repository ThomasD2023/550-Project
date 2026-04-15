/**
 * @fileoverview Routes for Michelin restaurant browsing endpoints.
 * GET /api/restaurants — Q11
 */
const express = require('express');
const router = express.Router();
const { filterRestaurants } = require('../controllers/restaurants');
const { parseIntParam, parseStringParam } = require('../middleware/validate');

/**
 * GET /api/restaurants
 * Q11 — Filter Michelin Restaurants
 */
router.get('/', async (req, res, next) => {
  try {
    const params = {
      cuisine: parseStringParam(req.query.cuisine),
      award: parseStringParam(req.query.award),
      country: parseStringParam(req.query.country),
      limit: parseIntParam(req.query.limit, 20, 1, 100),
      offset: parseIntParam(req.query.offset, 0, 0, 100000),
    };
    const data = await filterRestaurants(params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
