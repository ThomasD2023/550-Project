/**
 * @fileoverview Global error handling middleware.
 * Catches unhandled errors and returns proper HTTP status codes.
 */

/**
 * Global error handler — returns JSON error responses with appropriate status codes.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler for unmatched routes.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFoundHandler };
