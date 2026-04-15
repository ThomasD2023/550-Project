/**
 * @fileoverview Routes for regional analytics endpoints.
 * GET /api/regions/top — Q1
 * GET /api/regions/dining-scores — Q7
 * GET /api/regions/outdoor — Q8
 */
const express = require('express');
const router = express.Router();
const { getTopRegions, getDiningScores, getOutdoorRegions } = require('../controllers/regions');
const { parseIntParam } = require('../middleware/validate');

/**
 * GET /api/regions/top
 * Q1 (Complex) — Top Wine Regions by Tourism Ecosystem Score
 * @query {number} limit - Number of results (default: 10)
 */
router.get('/top', async (req, res, next) => {
  try {
    const limit = parseIntParam(req.query.limit, 10, 1, 50);
    const data = await getTopRegions(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/regions/dining-scores
 * Q7 (Complex) — Regional Vineyard-Dining Pairing Score
 * @query {number} min_vineyards - Minimum vineyard count per state (default: 3)
 */
router.get('/dining-scores', async (req, res, next) => {
  try {
    const minVineyards = parseIntParam(req.query.min_vineyards, 3, 1, 100);
    const data = await getDiningScores(minVineyards);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/regions/outdoor
 * Q8 — Best Regions for Outdoor Activities
 * @query {number} limit - Number of results (default: 20)
 */
router.get('/outdoor', async (req, res, next) => {
  try {
    const limit = parseIntParam(req.query.limit, 20, 1, 100);
    const data = await getOutdoorRegions(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
