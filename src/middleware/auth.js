const { verifyToken } = require('../utils/jwt');
const { supabase } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not found.'
        });
      }

      req.user = user;
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

const requireDriver = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!req.user.isDriver) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Driver privileges required.'
    });
  }
  
  next();
};

const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.isDriver) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer access only.'
    });
  }
  
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (tokenError) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    next(); // Continue even if there's an error
  }
};

// Middleware to check if user owns the resource or is admin
const requireOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!resourceUserId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required.'
    });
  }

  if (req.user._id.toString() !== resourceUserId && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireDriver,
  requireCustomer,
  optionalAuth,
  requireOwnership
};
