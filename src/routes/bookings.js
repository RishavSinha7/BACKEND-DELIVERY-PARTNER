const express = require('express');
const Booking = require('../models/Booking');
const { createBookingSchema } = require('../utils/validation');
const { authenticate, requireCustomer, requireDriver } = require('../middleware/auth');

const router = express.Router();

// Create a new booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { error, value } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }

    const bookingData = {
      ...value,
      customer: req.user._id
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Populate customer details
    await booking.populate('customer', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking.toJSON()
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all bookings for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, serviceType } = req.query;
    
    const query = {};
    
    // Filter by user type
    if (req.user.isDriver) {
      query.driver = req.user._id;
    } else {
      query.customer = req.user._id;
    }

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (serviceType) {
      query.serviceType = serviceType;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'customer', select: 'name phone' },
        { path: 'driver', select: 'name phone' }
      ]
    };

    const bookings = await Booking.paginate(query, options);

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a specific booking by ID
router.get('/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId })
      .populate('customer', 'name phone profileImage')
      .populate('driver', 'name phone profileImage');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    const hasAccess = booking.customer._id.toString() === req.user._id.toString() ||
                     (booking.driver && booking.driver._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking.toJSON()
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update booking status (for drivers)
router.patch('/:bookingId/status', authenticate, requireDriver, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes, location } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if driver is assigned to this booking
    if (booking.driver && booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this booking'
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['accepted', 'cancelled'],
      'accepted': ['driver_assigned', 'cancelled'],
      'driver_assigned': ['pickup_arrived', 'cancelled'],
      'pickup_arrived': ['picked_up', 'cancelled'],
      'picked_up': ['in_transit'],
      'in_transit': ['delivered', 'failed'],
      'delivered': [],
      'cancelled': [],
      'failed': []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    // Update booking
    booking.status = status;
    if (notes) {
      booking.notes.driver = notes;
    }

    // Set timestamps based on status
    switch (status) {
      case 'accepted':
        booking.acceptedAt = new Date();
        booking.driver = req.user._id;
        break;
      case 'picked_up':
        booking.pickedUpAt = new Date();
        break;
      case 'delivered':
        booking.deliveredAt = new Date();
        break;
      case 'cancelled':
        booking.cancelledAt = new Date();
        break;
    }

    // Add tracking event
    booking.addTrackingEvent(status, notes, location);

    await booking.save();
    await booking.populate('customer', 'name phone');
    await booking.populate('driver', 'name phone');

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking.toJSON()
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel booking (for customers)
router.patch('/:bookingId/cancel', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason, details } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings'
      });
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ['pending', 'accepted', 'driver_assigned'];
    if (!cancellableStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this stage'
      });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = {
      reason: reason || 'Cancelled by customer',
      details,
      cancelledBy: 'customer'
    };

    booking.addTrackingEvent('cancelled', `Cancelled by customer: ${reason}`, null);

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking.toJSON()
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update driver location
router.patch('/:bookingId/location', authenticate, requireDriver, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if driver is assigned to this booking
    if (!booking.driver || booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this booking'
      });
    }

    booking.updateDriverLocation(latitude, longitude);
    await booking.save();

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        latitude,
        longitude,
        lastUpdated: booking.driverLocation.lastUpdated
      }
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add rating and review
router.post('/:bookingId/rating', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed bookings'
      });
    }

    // Determine if rating is from customer or driver
    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isDriver = booking.driver && booking.driver.toString() === req.user._id.toString();

    if (!isCustomer && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate bookings you are involved in'
      });
    }

    // Add rating
    if (isCustomer) {
      booking.rating.customer = {
        rating,
        review,
        timestamp: new Date()
      };
    } else {
      booking.rating.driver = {
        rating,
        review,
        timestamp: new Date()
      };
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Rating added successfully',
      data: booking.rating
    });

  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get available bookings for drivers
router.get('/available/nearby', authenticate, requireDriver, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const bookings = await Booking.find({
      status: 'pending',
      'pickupLocation.coordinates.latitude': {
        $gte: parseFloat(latitude) - 0.1,
        $lte: parseFloat(latitude) + 0.1
      },
      'pickupLocation.coordinates.longitude': {
        $gte: parseFloat(longitude) - 0.1,
        $lte: parseFloat(longitude) + 0.1
      }
    })
    .populate('customer', 'name phone profileImage')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Get nearby bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
