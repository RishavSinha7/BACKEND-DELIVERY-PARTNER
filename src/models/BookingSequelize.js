const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'booking_id',
    defaultValue: () => 'BK' + Date.now() + Math.random().toString(36).substr(2, 9)
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'driver_id',
    references: {
      model: 'drivers',
      key: 'id'
    }
  },
  serviceType: {
    type: DataTypes.ENUM('two-wheeler', 'truck', 'intercity', 'packers-movers'),
    allowNull: false,
    field: 'service_type'
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'accepted',
      'driver_assigned',
      'pickup_arrived',
      'picked_up',
      'in_transit',
      'delivered',
      'cancelled',
      'cancelled_by_system',
      'failed'
    ),
    defaultValue: 'pending'
  },
  pickupLocation: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'pickup_location',
    validate: {
      isValidLocation(value) {
        if (!value.address || !value.coordinates) {
          throw new Error('Pickup location must have address and coordinates');
        }
      }
    }
  },
  dropLocation: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'drop_location',
    validate: {
      isValidLocation(value) {
        if (!value.address || !value.coordinates) {
          throw new Error('Drop location must have address and coordinates');
        }
      }
    }
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isArray(value) {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('Items must be a non-empty array');
        }
      }
    }
  },
  pricing: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      hasRequiredFields(value) {
        if (!value.baseFare || !value.total) {
          throw new Error('Pricing must include baseFare and total');
        }
      }
    }
  },
  distance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  estimatedTime: {
    type: DataTypes.JSONB,
    field: 'estimated_time'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'scheduled_at'
  },
  acceptedAt: {
    type: DataTypes.DATE,
    field: 'accepted_at'
  },
  pickedUpAt: {
    type: DataTypes.DATE,
    field: 'picked_up_at'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    field: 'delivered_at'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    field: 'cancelled_at'
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    field: 'cancellation_reason'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    field: 'payment_status'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    field: 'payment_method'
  },
  rating: {
    type: DataTypes.JSONB
  },
  trackingUpdates: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'tracking_updates'
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['customer_id']
    },
    {
      fields: ['driver_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['service_type']
    }
  ]
});

// Instance methods
Booking.prototype.updateStatus = function(newStatus, updateData = {}) {
  this.status = newStatus;
  
  // Set timestamp based on status
  const statusTimestamps = {
    'accepted': 'acceptedAt',
    'picked_up': 'pickedUpAt',
    'delivered': 'deliveredAt',
    'cancelled': 'cancelledAt'
  };
  
  if (statusTimestamps[newStatus]) {
    this[statusTimestamps[newStatus]] = new Date();
  }
  
  // Add tracking update
  const trackingUpdate = {
    status: newStatus,
    timestamp: new Date(),
    ...updateData
  };
  
  this.trackingUpdates = [...(this.trackingUpdates || []), trackingUpdate];
  
  return this.save();
};

Booking.prototype.addTrackingUpdate = function(update) {
  this.trackingUpdates = [...(this.trackingUpdates || []), {
    ...update,
    timestamp: new Date()
  }];
  return this.save();
};

// Class methods
Booking.findByCustomer = function(customerId, options = {}) {
  return this.findAll({
    where: { customerId },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Booking.findByDriver = function(driverId, options = {}) {
  return this.findAll({
    where: { driverId },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

Booking.findPending = function(serviceType = null) {
  const where = { status: 'pending' };
  if (serviceType) {
    where.serviceType = serviceType;
  }
  return this.findAll({
    where,
    order: [['createdAt', 'ASC']]
  });
};

module.exports = Booking;
