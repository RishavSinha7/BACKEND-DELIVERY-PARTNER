const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    // Attach user to socket
    socket.user = user;
    next();
    
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
