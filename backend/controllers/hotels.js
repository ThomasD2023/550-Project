/**
 * @fileoverview Controller for hotel browsing queries.
 * Q10 — Filter Hotels by Rating and Location
 */
const pool = require('../config/database');

/**
 * Q10 — Filter Hotels by Rating and Location
 * 
 * Browses and filters hotels across the platform by minimum rating and country.
 * Joins Hotel, City, State, Country tables for full location info.
 * 
 * Indexes used: idx_hotel_rating, idx_hotel_city, idx_city_state, idx_state_country
 * 
 * @param {Object} params - { minRating, country, limit, offset }
 */
async function filterHotels({ minRating = 1, country, limit = 20, offset = 0 }) {
  const countSql = `
    SELECT COUNT(*) AS total
    FROM hotel h
    JOIN city ci ON h.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE h.rating >= $1
      AND ($2::text IS NULL OR co.country_name = $2);
  `;

  const dataSql = `
    SELECT h.hotel_id, h.hotel_name, h.rating, h.address, h.latitude, h.longitude,
           h.description, h.facilities,
           ci.city_name, s.state_name, co.country_name
    FROM hotel h
    JOIN city ci ON h.city_id = ci.city_id
    JOIN state s ON ci.state_id = s.state_id
    JOIN country co ON s.country_id = co.country_id
    WHERE h.rating >= $1
      AND ($2::text IS NULL OR co.country_name = $2)
    ORDER BY h.rating DESC
    LIMIT $3 OFFSET $4;
  `;

  const start = Date.now();
  const [countResult, dataResult] = await Promise.all([
    pool.query(countSql, [minRating, country]),
    pool.query(dataSql, [minRating, country, limit, offset]),
  ]);
  const duration = Date.now() - start;
  console.log(`[QUERY] Q10 — Filter Hotels: ${duration}ms, ${dataResult.rows.length} rows`);

  return {
    hotels: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

module.exports = { filterHotels };
