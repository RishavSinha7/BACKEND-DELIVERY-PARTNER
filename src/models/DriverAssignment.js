const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DriverAssignment = sequelize.define('DriverAssignment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    driver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'drivers',
        key: 'id'
      }
    },
    booking_type: {
      type: DataTypes.STRING(10),
      allowNull: false // 'bike' or 'truck'
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: false // references either bike_bookings or truck_bookings
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
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true // null for bike bookings
    },
    pickup_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    otp_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pickup_time: {
      type: DataTypes.DATE,
      allowNull: true // when driver reached customer
    },
    completion_time: {
      type: DataTypes.DATE,
      allowNull: true // when job completed
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'driver_assignments',
    timestamps: false
  });

  return DriverAssignment;
};
