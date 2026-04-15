/**
 * @fileoverview Routes for POI (Points of Interest) endpoints.
 * GET /api/pois — Q12
 * GET /api/categories/stats — Q13
 */
const express = require('express');
const router = express.Router();
const { browsePois, getCategoryStats } = require('../controllers/pois');
const { parseIntParam, parseStringParam } = require('../middleware/validate');

/**
 * GET /api/pois
 * Q12 — Browse POIs by Category and Location
 */
router.get('/', async (req, res, next) => {
  try {
    const params = {
      category: parseStringParam(req.query.category),
      country: parseStringParam(req.query.country),
      limit: parseIntParam(req.query.limit, 20, 1, 100),
      offset: parseIntParam(req.query.offset, 0, 0, 100000),
    };
    const data = await browsePois(params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
