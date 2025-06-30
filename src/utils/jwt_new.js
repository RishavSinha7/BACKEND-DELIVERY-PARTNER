const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  } catch (error) {
    throw new Error('Refresh token generation failed');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};
