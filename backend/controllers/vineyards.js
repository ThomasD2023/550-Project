/**
 * @fileoverview Controller for vineyard-related queries.
 * Q2 — Search Vineyards with Filters
 * Q3 — Cascading Location Dropdown Options
 * Q4 — Nearby Hotels Ranked by Rating Within Radius (Complex)
 * Q5 — Nearby POIs by Category
 * Q6 — Nearby Michelin Restaurants
 */
const pool = require('../config/database');
const cache = require('../config/cache');

/**
 * Q2 — Search Vineyards with Filters
 * 
 * Filters vineyards by location hierarchy (country -> state -> city) and optional
 * keyword search using ILIKE. Supports pagination with LIMIT/OFFSET.
 * 
 * Indexes used: idx_vineyard_city, idx_city_state, idx_state_country
 * 
 * @param {Object} params - { country, state, city, name, limit, offset }
 */
async function searchVineyards({ country, state, city, name, limit = 20, offset = 0 }) {
  const countSql = `
    SELECT COUNT(*) AS total
    FROM vineyard v
    JOIN city ci ON v.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE ($1::text IS NULL OR co.country_name = $1)
      AND ($2::text IS NULL OR s.state_name = $2)
      AND ($3::text IS NULL OR ci.city_name = $3)
      AND ($4::text IS NULL OR v.name ILIKE '%' || $4 || '%');
  `;

  const dataSql = `
    SELECT v.vineyard_id, v.name, v.website, v.latitude, v.longitude,
           ci.city_name, s.state_name, co.country_name
    FROM vineyard v
    JOIN city ci ON v.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE ($1::text IS NULL OR co.country_name = $1)
      AND ($2::text IS NULL OR s.state_name = $2)
      AND ($3::text IS NULL OR ci.city_name = $3)
      AND ($4::text IS NULL OR v.name ILIKE '%' || $4 || '%')
    ORDER BY v.name
    LIMIT $5 OFFSET $6;
  `;

  const params = [country, state, city, name];
  const start = Date.now();
  const [countResult, dataResult] = await Promise.all([
    pool.query(countSql, params),
    pool.query(dataSql, [...params, limit, offset]),
  ]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q2 — Search Vineyards: ${duration}ms, ${dataResult.rows.length} rows`);

  return {
    vineyards: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
    page: Math.floor(offset / limit) + 1,
  };
}

/**
 * Get a single vineyard by ID.
 * @param {number} vineyardId - Vineyard ID
 */
async function getVineyardById(vineyardId) {
  const sql = `
    SELECT v.vineyard_id, v.name, v.website, v.latitude, v.longitude,
           ci.city_name, ci.city_id, s.state_name, co.country_name
    FROM vineyard v
    JOIN city ci ON v.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE v.vineyard_id = $1;
  `;
  const result = await pool.query(sql, [vineyardId]);
  return result.rows[0] || null;
}

/**
 * Q3 — Cascading Location Dropdown Options
 * 
 * Returns distinct country names, state names for a country, or city names for a state.
 * Used for cascading dropdown filters on the Vineyard Explorer page.
 * 
 * Indexes used: idx_state_country, idx_city_state
 * Optimization: Cached for 24 hours (location data doesn't change).
 */
async function getCountries() {
  const cacheKey = 'countries_list';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const sql = `SELECT DISTINCT country_name FROM country ORDER BY country_name;`;
  const result = await pool.query(sql);
  const data = { countries: result.rows.map(r => r.country_name) };
  cache.set(cacheKey, data, 86400); // 24 hours
  return data;
}

async function getStates(country) {
  const cacheKey = `states_${country}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT DISTINCT s.state_name
    FROM state s
    JOIN country co ON s.country_id = co.country_id
    WHERE co.country_name = $1
    ORDER BY s.state_name;
  `;
  const result = await pool.query(sql, [country]);
  const data = { states: result.rows.map(r => r.state_name) };
  cache.set(cacheKey, data, 86400);
  return data;
}

async function getCities(state) {
  const cacheKey = `cities_${state}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const sql = `
    SELECT DISTINCT ci.city_name
    FROM city ci
    JOIN state s ON ci.state_id = s.state_id
    WHERE s.state_name = $1
    ORDER BY ci.city_name;
  `;
  const result = await pool.query(sql, [state]);
  const data = { cities: result.rows.map(r => r.city_name) };
  cache.set(cacheKey, data, 86400);
  return data;
}

/**
 * Q4 (Complex) — Nearby Hotels Ranked by Rating Within Radius
 * 
 * Finds hotels within a user-specified radius of a vineyard using the Haversine formula.
 * Uses bounding-box pre-filtering before applying exact Haversine for optimization.
 * 
 * Indexes used: idx_hotel_lat_lng (composite lat/lng enables bounding-box pre-filtering),
 *               idx_hotel_rating, idx_hotel_city
 * Optimization: Bounding-box WHERE clause filters candidates before expensive Haversine.
 * 
 * @param {number} vineyardId - Vineyard ID
 * @param {number} radius - Search radius in km (default: 50)
 */
async function getNearbyHotels(vineyardId, radius = 50) {
  const sql = `
    SELECT h.hotel_name, h.rating, h.address, h.latitude, h.longitude,
      ci.city_name,
      ROUND((6371 * ACOS(
        LEAST(1.0, COS(RADIANS(v.latitude)) * COS(RADIANS(h.latitude))
        * COS(RADIANS(h.longitude) - RADIANS(v.longitude))
        + SIN(RADIANS(v.latitude)) * SIN(RADIANS(h.latitude)))
      ))::numeric, 2) AS distance_km
    FROM vineyard v
    CROSS JOIN hotel h
    JOIN city ci ON h.city_id = ci.city_id
    WHERE v.vineyard_id = $1
      AND h.latitude BETWEEN v.latitude - ($2 / 111.0) AND v.latitude + ($2 / 111.0)
      AND h.longitude BETWEEN v.longitude - ($2 / (111.0 * COS(RADIANS(v.latitude))))
                          AND v.longitude + ($2 / (111.0 * COS(RADIANS(v.latitude))))
      AND (6371 * ACOS(
        LEAST(1.0, COS(RADIANS(v.latitude)) * COS(RADIANS(h.latitude))
        * COS(RADIANS(h.longitude) - RADIANS(v.longitude))
        + SIN(RADIANS(v.latitude)) * SIN(RADIANS(h.latitude)))
      )) <= $2
    ORDER BY h.rating DESC, distance_km ASC
    LIMIT 20;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [vineyardId, radius]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q4 — Nearby Hotels: ${duration}ms, ${result.rows.length} rows`);

  // Get vineyard name
  const vResult = await pool.query('SELECT name FROM vineyard WHERE vineyard_id = $1', [vineyardId]);

  return {
    hotels: result.rows,
    vineyard_name: vResult.rows[0]?.name || 'Unknown',
    search_radius: radius,
  };
}

/**
 * Q5 — Nearby POIs by Category
 * 
 * Returns points of interest near a vineyard within a given radius, grouped by category.
 * Uses bounding-box pre-filtering before Haversine for optimization.
 * 
 * Indexes used: idx_poi_lat_lng (composite lat/lng enables bounding-box pre-filtering),
 *               idx_poi_cat_poi, idx_poi_cat_cat
 * 
 * @param {number} vineyardId - Vineyard ID
 * @param {number} radius - Search radius in km (default: 50)
 */
async function getNearbyPois(vineyardId, radius = 50) {
  const sql = `
    SELECT p.name, cat.category_name, p.num_links, p.latitude, p.longitude,
      ROUND((6371 * ACOS(
        LEAST(1.0, COS(RADIANS(v.latitude)) * COS(RADIANS(p.latitude))
        * COS(RADIANS(p.longitude) - RADIANS(v.longitude))
        + SIN(RADIANS(v.latitude)) * SIN(RADIANS(p.latitude)))
      ))::numeric, 2) AS distance_km
    FROM vineyard v
    CROSS JOIN poi p
    JOIN poi_category pc ON p.poi_id = pc.poi_id
    JOIN category cat ON pc.category_id = cat.category_id
    WHERE v.vineyard_id = $1
      AND p.latitude BETWEEN v.latitude - ($2 / 111.0) AND v.latitude + ($2 / 111.0)
      AND p.longitude BETWEEN v.longitude - ($2 / (111.0 * COS(RADIANS(v.latitude))))
                          AND v.longitude + ($2 / (111.0 * COS(RADIANS(v.latitude))))
      AND (6371 * ACOS(
        LEAST(1.0, COS(RADIANS(v.latitude)) * COS(RADIANS(p.latitude))
        * COS(RADIANS(p.longitude) - RADIANS(v.longitude))
        + SIN(RADIANS(v.latitude)) * SIN(RADIANS(p.latitude)))
      )) <= $2
    ORDER BY cat.category_name, distance_km
    LIMIT 50;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [vineyardId, radius]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q5 — Nearby POIs: ${duration}ms, ${result.rows.length} rows`);

  const vResult = await pool.query('SELECT name FROM vineyard WHERE vineyard_id = $1', [vineyardId]);

  return {
    pois: result.rows,
    vineyard_name: vResult.rows[0]?.name || 'Unknown',
  };
}

/**
 * Q6 — Nearby Michelin Restaurants
 * 
 * Finds Michelin-rated restaurants near a vineyard within a given radius.
 * Uses bounding-box pre-filtering before Haversine for optimization.
 * 
 * Indexes used: idx_michelin_lat_lng (composite lat/lng enables bounding-box pre-filtering),
 *               idx_michelin_award
 * 
 * @param {number} vineyardId - Vineyard ID
 * @param {number} radius - Search radius in km (default: 50)
 */
async function getNearbyRestaurants(vineyardId, radius = 50) {
  const sql = `
    SELECT m.name, m.award, m.cuisine, m.price, m.latitude, m.longitude,
      ROUND((6371 * ACOS(
        LEAST(1.0, COS(RADIANS(v.latitude)) * COS(RADIANS(m.latitude))
        * COS(RADIANS(m.longitude) - RADIANS(v.longitude))
        + SIN(RADIANS(v.latitude)) * SIN(RADIANS(m.latitude)))
      ))::numeric, 2) AS distance_km
    FROM vineyard v
    CROSS JOIN michelin_restaurant m
    WHERE v.vineyard_id = $1
      AND m.latitude BETWEEN v.latitude - ($2 / 111.0) AND v.latitude + ($2 / 111.0)
      AND m.longitude BETWEEN v.longitude - ($2 / (111.0 * COS(RADIANS(v.latitude))))
                          AND v.longitude + ($2 / (111.0 * COS(RADIANS(v.latitude))))
      AND (6371 * ACOS(
        LEAST(1.0, COS(RADIANS(v.latitude)) * COS(RADIANS(m.latitude))
        * COS(RADIANS(m.longitude) - RADIANS(v.longitude))
        + SIN(RADIANS(v.latitude)) * SIN(RADIANS(m.latitude)))
      )) <= $2
    ORDER BY m.award DESC, distance_km ASC
    LIMIT 20;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [vineyardId, radius]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q6 — Nearby Restaurants: ${duration}ms, ${result.rows.length} rows`);

  const vResult = await pool.query('SELECT name FROM vineyard WHERE vineyard_id = $1', [vineyardId]);

  return {
    restaurants: result.rows,
    vineyard_name: vResult.rows[0]?.name || 'Unknown',
  };
}

module.exports = {
  searchVineyards,
  getVineyardById,
  getCountries,
  getStates,
  getCities,
  getNearbyHotels,
  getNearbyPois,
  getNearbyRestaurants,
};
