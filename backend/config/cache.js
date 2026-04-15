/**
 * @fileoverview In-memory caching configuration using node-cache.
 * Caches slow-changing data: top regions (1hr), location dropdowns (24hr), category stats (1hr).
 */
const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 3600,       // Default TTL: 1 hour
  checkperiod: 600,   // Check for expired keys every 10 minutes
  useClones: false,    // Return references for better performance
});

module.exports = cache;
