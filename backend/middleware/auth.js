/**
 * @fileoverview Authentication middleware using JWT tokens in httpOnly cookies.
 * Verifies JWT and attaches user info to req.user.
 */
const jwt = require('jsonwebtoken');

/**
 * Verifies JWT token from httpOnly cookie.
 * Attaches decoded user to req.user if valid.
 */
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional auth — attaches user if token present, but doesn't block request.
 */
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, continue without user
    }
  }
  
  next();
};

module.exports = { authenticateToken, optionalAuth };
