/**
 * @fileoverview Routes for category stats endpoint.
 * GET /api/categories/stats — Q13
 */
const express = require('express');
const router = express.Router();
const { getCategoryStats } = require('../controllers/pois');
const { parseIntParam } = require('../middleware/validate');

/**
 * GET /api/categories/stats
 * Q13 — Category Distribution Stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    const limit = parseIntParam(req.query.limit, 20, 1, 100);
    const data = await getCategoryStats(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
