const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BikeBooking = sequelize.define('BikeBooking', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id'
      }
    },
    bike_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bikes',
        key: 'id'
      }
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    pickup_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    pickup_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duration_hours: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true
    },
    assigned_driver_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'bike_bookings',
    timestamps: false
  });

  return BikeBooking;
};
