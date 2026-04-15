/**
 * @fileoverview Controller for POI (Points of Interest) queries.
 * Q12 — Browse POIs by Category and Location
 * Q13 — Category Distribution Stats
 */
const pool = require('../config/database');
const cache = require('../config/cache');

/**
 * Q12 — Browse POIs by Category and Location
 * 
 * Filters and browses POIs by category keyword (ILIKE) and country.
 * Joins POI, POI_Category, Category, and location tables.
 * Ordered by num_links DESC (popularity).
 * 
 * Indexes used: idx_poi_num_links, idx_poi_city, idx_poi_cat_poi, idx_poi_cat_cat
 * 
 * @param {Object} params - { category, country, limit, offset }
 */
async function browsePois({ category, country, limit = 20, offset = 0 }) {
  const countSql = `
    SELECT COUNT(DISTINCT p.poi_id) AS total
    FROM poi p
    JOIN poi_category pc ON p.poi_id = pc.poi_id
    JOIN category cat ON pc.category_id = cat.category_id
    JOIN city ci ON p.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE ($1::text IS NULL OR cat.category_name ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR co.country_name = $2);
  `;

  const dataSql = `
    SELECT DISTINCT ON (p.poi_id) p.poi_id, p.name, cat.category_name,
           p.num_links, p.latitude, p.longitude,
           ci.city_name, s.state_name, co.country_name
    FROM poi p
    JOIN poi_category pc ON p.poi_id = pc.poi_id
    JOIN category cat ON pc.category_id = cat.category_id
    JOIN city ci ON p.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE ($1::text IS NULL OR cat.category_name ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR co.country_name = $2)
    ORDER BY p.poi_id, p.num_links DESC
    LIMIT $3 OFFSET $4;
  `;

  const start = Date.now();
  const [countResult, dataResult] = await Promise.all([
    pool.query(countSql, [category, country]),
    pool.query(dataSql, [category, country, limit, offset]),
  ]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q12 — Browse POIs: ${duration}ms, ${dataResult.rows.length} rows`);

  return {
    pois: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

/**
 * Q13 — Category Distribution Stats
 * 
 * Returns POI count per category for the filter UI and distribution pie chart.
 * Aggregates the POI_Category junction table, grouped by category_name.
 * 
 * Indexes used: idx_poi_cat_cat
 * Optimization: Cached for 1 hour (category distribution changes slowly).
 * 
 * @param {number} limit - Top N categories (default: 20)
 */
async function getCategoryStats(limit = 20) {
  const cacheKey = `category_stats_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('[CACHE HIT] Q13 — Category Stats');
    return cached;
  }

  const sql = `
    SELECT cat.category_name, COUNT(*) AS count
    FROM poi_category pc
    JOIN category cat ON pc.category_id = cat.category_id
    GROUP BY cat.category_name
    ORDER BY count DESC
    LIMIT $1;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [limit]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q13 — Category Stats: ${duration}ms, ${result.rows.length} rows`);

  const data = { categories: result.rows };
  cache.set(cacheKey, data, 3600); // 1 hour
  return data;
}

module.exports = { browsePois, getCategoryStats };
