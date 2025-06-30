const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { driverProfileSchema } = require('../utils/validation');
const { authenticate, requireDriver } = require('../middleware/auth');

const router = express.Router();

// Get driver profile with additional driver-specific information
router.get('/profile', authenticate, requireDriver, async (req, res) => {
  try {
    const driver = await User.findById(req.user._id).select('-password');
    
    // Get driver statistics
    const totalTrips = await Booking.countDocuments({ driver: req.user._id });
    const completedTrips = await Booking.countDocuments({ 
      driver: req.user._id, 
      status: 'delivered' 
    });
    
    const earnings = await Booking.aggregate([
      { $match: { driver: req.user._id, status: 'delivered' } },
      { $group: { 
        _id: null, 
        totalEarnings: { $sum: '$pricing.total' },
        thisMonth: {
          $sum: {
            $cond: [
              {
                $gte: ['$deliveredAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)]
              },
              '$pricing.total',
              0
            ]
          }
        }
      }}
    ]);

    const ratings = await Booking.aggregate([
      { $match: { driver: req.user._id, 'rating.customer.rating': { $exists: true } } },
      { $group: { 
        _id: null, 
        avgRating: { $avg: '$rating.customer.rating' },
        totalRatings: { $sum: 1 }
      }}
    ]);

    const driverStats = {
      totalTrips,
      completedTrips,
      totalEarnings: earnings[0]?.totalEarnings || 0,
      monthlyEarnings: earnings[0]?.thisMonth || 0,
      averageRating: ratings[0]?.avgRating || 0,
      totalRatings: ratings[0]?.totalRatings || 0,
      successRate: totalTrips > 0 ? (completedTrips / totalTrips * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: {
        driver: driver.toJSON(),
        stats: driverStats
      }
    });

  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update driver profile
router.put('/profile', authenticate, requireDriver, async (req, res) => {
  try {
    const { error, value } = driverProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }

    const driver = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { driverProfile: value } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver profile updated successfully',
      data: {
        driver: driver.toJSON()
      }
    });

  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get driver's trips
router.get('/trips', authenticate, requireDriver, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    const query = { driver: req.user._id };
    
    // Apply filters
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const trips = await Booking.find(query)
      .populate('customer', 'name phone profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get driver trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get active trip for driver
router.get('/active-trip', authenticate, requireDriver, async (req, res) => {
  try {
    const activeTrip = await Booking.findOne({
      driver: req.user._id,
      status: { $in: ['accepted', 'driver_assigned', 'pickup_arrived', 'picked_up', 'in_transit'] }
    }).populate('customer', 'name phone profileImage');

    res.json({
      success: true,
      data: {
        activeTrip
      }
    });

  } catch (error) {
    console.error('Get active trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Accept a booking
router.post('/accept-booking/:bookingId', authenticate, requireDriver, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Check if driver already has an active trip
    const activeTrip = await Booking.findOne({
      driver: req.user._id,
      status: { $in: ['accepted', 'driver_assigned', 'pickup_arrived', 'picked_up', 'in_transit'] }
    });

    if (activeTrip) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active trip'
      });
    }

    const booking = await Booking.findOne({ bookingId, status: 'pending' });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already accepted'
      });
    }

    // Accept the booking
    booking.driver = req.user._id;
    booking.status = 'accepted';
    booking.acceptedAt = new Date();
    booking.addTrackingEvent('accepted', 'Driver accepted the booking', null);

    await booking.save();
    await booking.populate('customer', 'name phone profileImage');

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      data: booking.toJSON()
    });

  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get driver earnings
router.get('/earnings', authenticate, requireDriver, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const earnings = await Booking.aggregate([
      {
        $match: {
          driver: req.user._id,
          status: 'delivered',
          deliveredAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.total' },
          totalTrips: { $sum: 1 },
          avgEarningsPerTrip: { $avg: '$pricing.total' }
        }
      }
    ]);

    // Get daily breakdown for the period
    const dailyEarnings = await Booking.aggregate([
      {
        $match: {
          driver: req.user._id,
          status: 'delivered',
          deliveredAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' }
          },
          earnings: { $sum: '$pricing.total' },
          trips: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const result = earnings[0] || {
      totalEarnings: 0,
      totalTrips: 0,
      avgEarningsPerTrip: 0
    };

    res.json({
      success: true,
      data: {
        period,
        summary: result,
        dailyBreakdown: dailyEarnings
      }
    });

  } catch (error) {
    console.error('Get driver earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle driver availability
router.patch('/availability', authenticate, requireDriver, async (req, res) => {
  try {
    const { isAvailable, location } = req.body;

    const driver = await User.findById(req.user._id);
    
    // Update availability status
    if (!driver.driverProfile) {
      driver.driverProfile = {};
    }
    
    driver.driverProfile.isAvailable = isAvailable;
    driver.driverProfile.lastLocation = location;
    driver.driverProfile.lastActiveAt = new Date();

    await driver.save();

    res.json({
      success: true,
      message: `Driver ${isAvailable ? 'online' : 'offline'}`,
      data: {
        isAvailable,
        lastActiveAt: driver.driverProfile.lastActiveAt
      }
    });

  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get driver ratings and reviews
router.get('/ratings', authenticate, requireDriver, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Booking.find({
      driver: req.user._id,
      'rating.customer.rating': { $exists: true }
    })
    .populate('customer', 'name profileImage')
    .select('rating.customer serviceType deliveredAt')
    .sort({ deliveredAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    const total = await Booking.countDocuments({
      driver: req.user._id,
      'rating.customer.rating': { $exists: true }
    });

    // Calculate rating distribution
    const ratingDistribution = await Booking.aggregate([
      { $match: { driver: req.user._id, 'rating.customer.rating': { $exists: true } } },
      { $group: { _id: '$rating.customer.rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        ratings,
        distribution: ratingDistribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get driver ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get driver documents (for verification)
router.get('/documents', authenticate, requireDriver, async (req, res) => {
  try {
    // TODO: Implement document management
    res.json({
      success: true,
      data: {
        documents: {
          drivingLicense: {
            uploaded: false,
            verified: false,
            url: null
          },
          vehicleRegistration: {
            uploaded: false,
            verified: false,
            url: null
          },
          insurance: {
            uploaded: false,
            verified: false,
            url: null
          }
        }
      }
    });
  } catch (error) {
    console.error('Get driver documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload driver documents
router.post('/documents/:type', authenticate, requireDriver, async (req, res) => {
  try {
    // TODO: Implement document upload with multer and cloudinary
    res.status(501).json({
      success: false,
      message: 'Document upload not implemented yet'
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
