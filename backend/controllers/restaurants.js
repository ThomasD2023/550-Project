/**
 * @fileoverview Controller for Michelin restaurant browsing queries.
 * Q11 — Filter Michelin Restaurants
 */
const pool = require('../config/database');

/**
 * Q11 — Filter Michelin Restaurants
 * 
 * Browses and filters Michelin restaurants by cuisine (ILIKE), award level, and country.
 * Joins Michelin_Restaurant with location hierarchy for full location info.
 * 
 * Indexes used: idx_michelin_award, idx_michelin_city, idx_city_state, idx_state_country
 * 
 * @param {Object} params - { cuisine, award, country, limit, offset }
 */
async function filterRestaurants({ cuisine, award, country, limit = 20, offset = 0 }) {
  const countSql = `
    SELECT COUNT(*) AS total
    FROM michelin_restaurant m
    JOIN city ci ON m.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE ($1::text IS NULL OR m.cuisine ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR m.award = $2)
      AND ($3::text IS NULL OR co.country_name = $3);
  `;

  const dataSql = `
    SELECT m.restaurant_id, m.name, m.award, m.cuisine, m.price,
           m.address, m.latitude, m.longitude, m.green_star,
           m.phone_number, m.url, m.website_url, m.description,
           ci.city_name, s.state_name, co.country_name
    FROM michelin_restaurant m
    JOIN city ci ON m.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE ($1::text IS NULL OR m.cuisine ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR m.award = $2)
      AND ($3::text IS NULL OR co.country_name = $3)
    ORDER BY m.award DESC
    LIMIT $4 OFFSET $5;
  `;

  const start = Date.now();
  const [countResult, dataResult] = await Promise.all([
    pool.query(countSql, [cuisine, award, country]),
    pool.query(dataSql, [cuisine, award, country, limit, offset]),
  ]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q11 — Filter Restaurants: ${duration}ms, ${dataResult.rows.length} rows`);

  return {
    restaurants: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

module.exports = { filterRestaurants };
