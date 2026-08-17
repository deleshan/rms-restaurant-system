const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request
    // decoded usually contains { id, role, restaurantId }
    req.user = decoded; 
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Generic Role Restriction
 * Usage: restrictTo('admin', 'manager')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission for this action' });
    }
    next();
  };
};

/**
 * Shorthand for Admin only
 * Usage: admin
 */
const admin = restrictTo('admin');

module.exports = { protect, restrictTo, admin };