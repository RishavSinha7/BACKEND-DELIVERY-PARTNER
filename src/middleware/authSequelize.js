const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Role-based middleware
const requireDriver = (req, res, next) => {
  if (!req.user || !req.user.isDriver) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Driver privileges required.'
    });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.isDriver) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer privileges required.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireDriver,
  requireCustomer
};
