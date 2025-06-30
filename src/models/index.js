const User = require('./UserSequelize');
const Booking = require('./BookingSequelize');
const { sequelize } = require('../config/database');

// Define associations
User.hasMany(Booking, {
  foreignKey: 'customerId',
  as: 'customerBookings'
});

Booking.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer'
});

// Export models and database connection
module.exports = {
  User,
  Booking,
  sequelize
};
