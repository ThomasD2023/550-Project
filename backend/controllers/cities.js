/**
 * @fileoverview Controller for city-related queries.
 * Q9 — City Trip Planner Bundle (Complex)
 */
const pool = require('../config/database');

/**
 * Q9 (Complex) — City Trip Planner Bundle
 * 
 * For a given city, returns the top-ranked vineyards, hotels, restaurants, and POIs
 * in a single query using 4 CTEs with ROW_NUMBER window functions and UNION ALL.
 * 
 * Indexes used: idx_vineyard_city, idx_hotel_city, idx_michelin_city, idx_poi_city,
 *               idx_hotel_rating, idx_michelin_award, idx_poi_num_links
 * 
 * @param {number} cityId - City ID
 * @param {number|null} minRating - Minimum hotel rating filter (1-5)
 */
async function getCityBundle(cityId, minRating = null) {
  const sql = `
    WITH ranked_vineyards AS (
      SELECT v.name, v.website, 'vineyard' AS type,
        ROW_NUMBER() OVER(ORDER BY v.name) AS rank
      FROM vineyard v WHERE v.city_id = $1
    ),
    ranked_hotels AS (
      SELECT h.hotel_name AS name, NULL AS website, 'hotel' AS type,
        ROW_NUMBER() OVER(ORDER BY h.rating DESC) AS rank
      FROM hotel h WHERE h.city_id = $1
        AND ($2::int IS NULL OR h.rating >= $2)
    ),
    ranked_restaurants AS (
      SELECT m.name, m.website_url AS website,
        'restaurant' AS type,
        ROW_NUMBER() OVER(ORDER BY m.award DESC) AS rank
      FROM michelin_restaurant m WHERE m.city_id = $1
    ),
    ranked_pois AS (
      SELECT p.name, NULL AS website, 'attraction' AS type,
        ROW_NUMBER() OVER(ORDER BY p.num_links DESC) AS rank
      FROM poi p WHERE p.city_id = $1
    )
    SELECT * FROM ranked_vineyards WHERE rank <= 3
    UNION ALL
    SELECT * FROM ranked_hotels WHERE rank <= 3
    UNION ALL
    SELECT * FROM ranked_restaurants WHERE rank <= 3
    UNION ALL
    SELECT * FROM ranked_pois WHERE rank <= 5;
  `;

  const start = Date.now();
  const result = await pool.query(sql, [cityId, minRating]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q9 — City Trip Bundle: ${duration}ms, ${result.rows.length} rows`);

  // Get city name
  const cityResult = await pool.query(
    `SELECT ci.city_name, s.state_name, co.country_name
     FROM city ci JOIN state s ON ci.state_id = s.state_id
     JOIN country co ON s.country_id = co.country_id
     WHERE ci.city_id = $1`,
    [cityId]
  );

  return {
    city_name: cityResult.rows[0]?.city_name || 'Unknown',
    state_name: cityResult.rows[0]?.state_name || '',
    country_name: cityResult.rows[0]?.country_name || '',
    bundle: result.rows,
  };
}

/**
 * Search cities by name for the trip planner city selector.
 * @param {string} query - City name search term
 * @param {number} limit - Max results
 */
async function searchCities(query, limit = 20) {
  const sql = `
    SELECT ci.city_id, ci.city_name, s.state_name, co.country_name
    FROM city ci
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE ci.city_name ILIKE '%' || $1 || '%'
    ORDER BY ci.city_name
    LIMIT $2;
  `;
  const result = await pool.query(sql, [query, limit]);
  return { cities: result.rows };
}

module.exports = { getCityBundle, searchCities };
