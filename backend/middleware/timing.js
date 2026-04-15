/**
 * @fileoverview Middleware to log query/request execution time.
 * Logs duration to console for performance monitoring.
 */

/**
 * Timing middleware — records start time and logs duration on response finish.
 */
const timingMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Set the header before response is sent
  const originalEnd = res.end;
  res.end = function(...args) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const rounded = durationMs.toFixed(2);
    
    // Only set header if headers haven't been sent yet
    if (!res.headersSent) {
      try {
        res.setHeader('X-Response-Time', `${rounded}ms`);
      } catch (e) {
        // Ignore header errors
      }
    }
    
    console.log(`[TIMING] ${req.method} ${req.originalUrl} — ${rounded}ms (${res.statusCode})`);
    originalEnd.apply(res, args);
  };
  
  next();
};

module.exports = timingMiddleware;
