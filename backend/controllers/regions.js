/**
 * @fileoverview Controller for regional analytics queries.
 * Q1 — Top Wine Regions by Tourism Ecosystem Score (Complex)
 * Q7 — Regional Vineyard-Dining Pairing Score (Complex)
 * Q8 — Best Regions for Outdoor Activities
 */
const pool = require('../config/database');
const cache = require('../config/cache');

/**
 * Q1 (Complex) — Top Wine Regions by Tourism Ecosystem Score
 * 
 * Uses 4 CTEs to aggregate vineyard count, hotel ratings, Michelin restaurant count,
 * and POI count per country. Computes a weighted composite ecosystem_score.
 * 
 * Indexes used: idx_vineyard_city, idx_hotel_city, idx_michelin_city, idx_poi_city
 * Optimization: Results cached for 1 hour (slow-changing aggregation data).
 * 
 * @param {number} limit - Number of results (default: 10)
 */
async function getTopRegions(limit = 10) {
  const cacheKey = `top_regions_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('[CACHE HIT] Q1 — Top Wine Regions');
    return cached;
  }

  const sql = `
    WITH region_vineyards AS (
      SELECT co.country_name, COUNT(*) AS vineyard_cnt
      FROM vineyard v
      JOIN city ci ON v.city_id = ci.city_id
      JOIN state s ON ci.state_id = s.state_id
      JOIN country co ON s.country_id = co.country_id
      GROUP BY co.country_name
    ),
    region_hotels AS (
      SELECT co.country_name, AVG(h.rating) AS avg_rating,
             COUNT(*) AS hotel_cnt
      FROM hotel h
      JOIN city ci ON h.city_id = ci.city_id
      JOIN state s ON ci.state_id = s.state_id
      JOIN country co ON s.country_id = co.country_id
      GROUP BY co.country_name
    ),
    region_dining AS (
      SELECT co.country_name, COUNT(*) AS michelin_cnt
      FROM michelin_restaurant m
      JOIN city ci ON m.city_id = ci.city_id
      JOIN state s ON ci.state_id = s.state_id
      JOIN country co ON s.country_id = co.country_id
      GROUP BY co.country_name
    ),
    region_pois AS (
      SELECT co.country_name, COUNT(*) AS poi_cnt
      FROM poi p
      JOIN city ci ON p.city_id = ci.city_id
      JOIN state s ON ci.state_id = s.state_id
      JOIN country co ON s.country_id = co.country_id
      GROUP BY co.country_name
    )
    SELECT rv.country_name,
      rv.vineyard_cnt,
      ROUND(COALESCE(rh.avg_rating, 0)::numeric, 2) AS avg_rating,
      COALESCE(rd.michelin_cnt, 0) AS michelin_cnt,
      COALESCE(rp.poi_cnt, 0) AS poi_cnt,
      ROUND((rv.vineyard_cnt * 0.3 + COALESCE(rh.avg_rating, 0) * 10 * 0.25
       + COALESCE(rd.michelin_cnt, 0) * 0.25 + COALESCE(rp.poi_cnt, 0) * 0.001 * 0.2)::numeric, 2) AS ecosystem_score
    FROM region_vineyards rv
    LEFT JOIN region_hotels rh ON rv.country_name = rh.country_name
    LEFT JOIN region_dining rd ON rv.country_name = rd.country_name
    LEFT JOIN region_pois rp ON rv.country_name = rp.country_name
    ORDER BY ecosystem_score DESC
    LIMIT $1;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [limit]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q1 — Top Wine Regions: ${duration}ms, ${result.rows.length} rows`);

  const data = { regions: result.rows };
  cache.set(cacheKey, data, 3600); // Cache for 1 hour
  return data;
}

/**
 * Q7 (Complex) — Regional Vineyard-Dining Pairing Score
 * 
 * Ranks states by dining pairing score: counts Michelin restaurants within 50km of
 * any vineyard in that state, weighted by star level using CASE aggregation.
 * Uses EXISTS subquery to filter regions with quality hotels (rating >= 4).
 * 
 * Indexes used: idx_vineyard_city, idx_michelin_lat_lng (bounding-box pre-filter),
 *               idx_hotel_city, idx_hotel_rating
 * Optimization: Bounding-box pre-filter before Haversine calculation.
 * 
 * @param {number} minVineyards - Minimum vineyard count per state (default: 3)
 */
async function getDiningScores(minVineyards = 3) {
  const sql = `
    SELECT s.state_name, co.country_name,
      COUNT(DISTINCT v.vineyard_id) AS vineyard_count,
      ROUND(SUM(CASE
        WHEN m.award = '3 Stars' THEN 3
        WHEN m.award = '2 Stars' THEN 2
        WHEN m.award = '1 Star' THEN 1
        ELSE 0.5
      END)::numeric, 2) AS dining_score,
      COUNT(DISTINCT m.restaurant_id) AS restaurant_count
    FROM vineyard v
    JOIN city ci ON v.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    JOIN michelin_restaurant m ON
      m.latitude BETWEEN v.latitude - (50.0 / 111.0) AND v.latitude + (50.0 / 111.0)
      AND m.longitude BETWEEN v.longitude - (50.0 / (111.0 * COS(RADIANS(v.latitude))))
                          AND v.longitude + (50.0 / (111.0 * COS(RADIANS(v.latitude))))
    WHERE EXISTS (
      SELECT 1 FROM hotel h
      WHERE h.city_id = ci.city_id AND h.rating >= 4
    )
    AND (6371 * ACOS(
      LEAST(1.0, COS(RADIANS(v.latitude)) * COS(RADIANS(m.latitude))
      * COS(RADIANS(m.longitude) - RADIANS(v.longitude))
      + SIN(RADIANS(v.latitude)) * SIN(RADIANS(m.latitude)))
    )) <= 50
    GROUP BY s.state_name, co.country_name
    HAVING COUNT(DISTINCT v.vineyard_id) >= $1
    ORDER BY dining_score DESC
    LIMIT 30;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [minVineyards]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q7 — Dining Pairing Scores: ${duration}ms, ${result.rows.length} rows`);

  return { regions: result.rows };
}

/**
 * Q8 — Best Regions for Outdoor Activities
 * 
 * Ranks regions by outdoor/nature-related POI count, filtering categories
 * containing keywords like park, trail, nature, mountain, lake, outdoor.
 * 
 * Indexes used: idx_poi_city, idx_poi_cat_poi, idx_poi_cat_cat
 * 
 * @param {number} limit - Number of results (default: 20)
 */
async function getOutdoorRegions(limit = 20) {
  const sql = `
    SELECT co.country_name, s.state_name,
      COUNT(*) AS outdoor_poi_count
    FROM poi p
    JOIN poi_category pc ON p.poi_id = pc.poi_id
    JOIN category cat ON pc.category_id = cat.category_id
    JOIN city ci ON p.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE LOWER(cat.category_name) SIMILAR TO '%(park|trail|nature|mountain|lake|outdoor|forest|garden|hiking)%'
    GROUP BY co.country_name, s.state_name
    ORDER BY outdoor_poi_count DESC
    LIMIT $1;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [limit]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q8 — Outdoor Regions: ${duration}ms, ${result.rows.length} rows`);

  return { regions: result.rows };
}

module.exports = { getTopRegions, getDiningScores, getOutdoorRegions };
