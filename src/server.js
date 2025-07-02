const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const bikesRoutes = require('./routes/bikes');
const trucksRoutes = require('./routes/trucks');
const bikeBookingsRoutes = require('./routes/bike-bookings');
const truckBookingsRoutes = require('./routes/truck-bookings');
const driversRoutes = require('./routes/drivers-new');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Delivery Partner API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    schema: 'supabase-postgresql'
  });
});

// API Routes
app.use('/api/v1/bikes', bikesRoutes);
app.use('/api/v1/trucks', trucksRoutes);
app.use('/api/v1/bike-bookings', bikeBookingsRoutes);
app.use('/api/v1/truck-bookings', truckBookingsRoutes);
app.use('/api/v1/drivers', driversRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Test endpoint for database connectivity
app.get('/api/test', async (req, res) => {
  try {
    const { supabase } = require('./models');
    
    // Test database connection
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join driver room for location updates
  socket.on('join-driver', (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Driver ${driverId} joined room`);
  });
  
  // Join customer room for booking updates
  socket.on('join-customer', (customerId) => {
    socket.join(`customer-${customerId}`);
    console.log(`Customer ${customerId} joined room`);
  });
  
  // Handle driver location updates
  socket.on('driver-location-update', (data) => {
    // Broadcast to customers tracking this driver
    socket.broadcast.to(`driver-${data.driverId}`).emit('location-update', data);
  });
  
  // Handle booking status updates
  socket.on('booking-update', (data) => {
    // Broadcast to relevant customers
    socket.broadcast.to(`customer-${data.customerId}`).emit('booking-status-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Delivery Partner Server...');
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Database: Supabase PostgreSQL`);
    
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}`);
      console.log(`📚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
      console.log('');
      console.log('📋 Available API Endpoints:');
      console.log('  🚲 Bikes: /api/v1/bikes');
      console.log('  🚛 Trucks: /api/v1/trucks');
      console.log('  📝 Bike Bookings: /api/v1/bike-bookings');
      console.log('  📝 Truck Bookings: /api/v1/truck-bookings');
      console.log('  👨‍💼 Drivers: /api/v1/drivers');
      console.log('  🔐 Auth: /api/auth');
      console.log('  👤 Users: /api/users');
      console.log('  💰 Estimates: /api/estimates');
      console.log('');
      console.log('🎯 Ready to accept requests!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

module.exports = { app, server, io };
