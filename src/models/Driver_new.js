const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Driver = sequelize.define('Driver', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    profile_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'profiles',
        key: 'id'
      }
    },
    driver_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    vehicle_type: {
      type: DataTypes.STRING(20),
      allowNull: false // 'bike' or 'truck'
    },
    vehicle_registration: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    current_status: {
      type: DataTypes.ENUM('available', 'busy', 'offline'),
      defaultValue: 'available'
    },
    current_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    current_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    last_location_update: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'drivers',
    timestamps: false
  });

  return Driver;
};
