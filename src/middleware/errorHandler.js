const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || 500
  };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    error.statusCode = 400;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error.message = `Duplicate value for field: ${field}`;
    error.statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    error.message = errors.join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Rate limit error
  if (err.statusCode === 429) {
    error.message = 'Too many requests, please try again later';
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err;
  }

  res.status(error.statusCode).json(error);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
