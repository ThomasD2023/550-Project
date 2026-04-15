/**
 * @fileoverview Routes for hotel browsing endpoints.
 * GET /api/hotels — Q10
 */
const express = require('express');
const router = express.Router();
const { filterHotels } = require('../controllers/hotels');
const { parseIntParam, parseStringParam } = require('../middleware/validate');

/**
 * GET /api/hotels
 * Q10 — Filter Hotels by Rating and Location
 */
router.get('/', async (req, res, next) => {
  try {
    const params = {
      minRating: parseIntParam(req.query.min_rating, 1, 1, 5),
      country: parseStringParam(req.query.country),
      limit: parseIntParam(req.query.limit, 20, 1, 100),
      offset: parseIntParam(req.query.offset, 0, 0, 100000),
    };
    const data = await filterHotels(params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
