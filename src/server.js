const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import database configuration
const { testConnection, syncDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const driverRoutes = require('./routes/drivers');
const bookingRoutes = require('./routes/bookings');
const estimateRoutes = require('./routes/estimates');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const socketAuth = require('./middleware/socketAuth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/estimates', estimateRoutes);

// Socket.io connection handling
io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Join user to their personal room
  socket.join(`user_${socket.user.id}`);
  
  // Join drivers to driver room
  if (socket.user.isDriver) {
    socket.join('drivers');
  }

  // Handle booking events
  socket.on('join_booking', (bookingId) => {
    socket.join(`booking_${bookingId}`);
  });

  socket.on('leave_booking', (bookingId) => {
    socket.leave(`booking_${bookingId}`);
  });

  // Handle driver location updates
  socket.on('driver_location_update', (data) => {
    if (socket.user.isDriver) {
      socket.to(`booking_${data.bookingId}`).emit('driver_location', {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection and server startup
testConnection()
  .then(async () => {
    console.log('✅ Database connection established');
    
    // Sync database models
    await syncDatabase();
    console.log('✅ Database models synchronized');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️ Database: Supabase PostgreSQL`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    const { sequelize } = require('./config/database');
    sequelize.close();
    process.exit(0);
  });
});

module.exports = { app, io };
