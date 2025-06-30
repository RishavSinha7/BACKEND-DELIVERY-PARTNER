# Delivery Partner Backend

A comprehensive Node.js backend API for the Delivery Partner application supporting authentication, booking management, real-time tracking, and more.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Customer/Driver)
  - Password reset functionality
  - Rate limiting for security

- **User Management**
  - User registration and profile management
  - Driver-specific profiles and statistics
  - Document upload and verification
  - Device token management for push notifications

- **Booking System**
  - Multi-service type support (Two-wheeler, Truck, Intercity, Packers & Movers)
  - Real-time price estimation
  - Status tracking and updates
  - Location-based matching

- **Real-time Features**
  - Socket.io for live updates
  - Driver location tracking
  - Booking status notifications

- **Pricing Engine**
  - Dynamic pricing based on distance, time, and demand
  - Surge pricing support
  - Service-specific pricing rules

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Real-time**: Socket.io
- **Security**: Helmet, Rate limiting, CORS
- **Password Hashing**: bcryptjs

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd delivery-partner-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/delivery-partner
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:userId` - Get public user profile
- `GET /api/users/stats/overview` - Get user statistics
- `PUT /api/users/device-token` - Update device token
- `DELETE /api/users/account` - Deactivate account

### Drivers
- `GET /api/drivers/profile` - Get driver profile with stats
- `PUT /api/drivers/profile` - Update driver profile
- `GET /api/drivers/trips` - Get driver trips
- `GET /api/drivers/active-trip` - Get current active trip
- `POST /api/drivers/accept-booking/:bookingId` - Accept a booking
- `GET /api/drivers/earnings` - Get earnings report
- `PATCH /api/drivers/availability` - Toggle availability
- `GET /api/drivers/ratings` - Get ratings and reviews

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:bookingId` - Get specific booking
- `PATCH /api/bookings/:bookingId/status` - Update booking status
- `PATCH /api/bookings/:bookingId/cancel` - Cancel booking
- `PATCH /api/bookings/:bookingId/location` - Update driver location
- `POST /api/bookings/:bookingId/rating` - Add rating and review
- `GET /api/bookings/available/nearby` - Get nearby available bookings

### Estimates
- `POST /api/estimates/calculate` - Calculate price estimate
- `GET /api/estimates/service-types` - Get available service types
- `GET /api/estimates/pricing/:serviceType` - Get pricing details
- `GET /api/estimates/surge/:serviceType` - Get surge pricing info

## Socket.io Events

### Client to Server
- `join_booking` - Join booking room for updates
- `leave_booking` - Leave booking room
- `driver_location_update` - Update driver location

### Server to Client
- `driver_location` - Receive driver location updates
- `booking_status_update` - Receive booking status changes
- `new_booking_available` - Notify drivers of new bookings

## Database Models

### User
- Personal information (name, phone, email)
- Authentication data (password hash)
- Role information (isDriver)
- Profile image and address
- Device tokens for notifications

### Booking
- Service type and status
- Pickup and drop locations
- Pricing breakdown
- Customer and driver references
- Tracking history
- Ratings and reviews

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- CORS protection
- Helmet for security headers
- Input validation with Joi
- Error handling middleware

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/delivery-partner

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional Services
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Development

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Run in development mode**
   ```bash
   npm run dev
   ```

3. **Test the API**
   - Use Postman or any API client
   - Base URL: `http://localhost:5000/api`
   - Health check: `GET /api/health`

## Deployment

1. **Environment Setup**
   - Set NODE_ENV=production
   - Configure production MongoDB URI
   - Set strong JWT secret
   - Configure CORS for production frontend URL

2. **Build and Start**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
