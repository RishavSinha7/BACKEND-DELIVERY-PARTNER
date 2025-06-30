const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bike = sequelize.define('Bike', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    registration_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'bikes',
    timestamps: false
  });

  return Bike;
};
