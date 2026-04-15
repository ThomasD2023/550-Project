/**
 * @fileoverview Routes for location cascading dropdown endpoints.
 * GET /api/locations/countries — All countries
 * GET /api/locations/states — Q3 states for a country
 * GET /api/locations/cities — Q3 cities for a state
 */
const express = require('express');
const router = express.Router();
const { getCountries, getStates, getCities } = require('../controllers/vineyards');
const { parseStringParam } = require('../middleware/validate');

/**
 * GET /api/locations/countries
 * Returns all distinct country names.
 */
router.get('/countries', async (req, res, next) => {
  try {
    const data = await getCountries();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/locations/states
 * Q3 — Returns states for a given country.
 * @query {string} country - Country name (required)
 */
router.get('/states', async (req, res, next) => {
  try {
    const country = parseStringParam(req.query.country);
    if (!country) return res.status(400).json({ error: 'country parameter is required' });
    const data = await getStates(country);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/locations/cities
 * Q3 — Returns cities for a given state.
 * @query {string} state - State name (required)
 */
router.get('/cities', async (req, res, next) => {
  try {
    const state = parseStringParam(req.query.state);
    if (!state) return res.status(400).json({ error: 'state parameter is required' });
    const data = await getCities(state);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
