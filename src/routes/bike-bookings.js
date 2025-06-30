const express = require('express');
const { BikeBooking, Bike } = require('../models/NewSchemaModels');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const bikeBookingSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  bike_id: Joi.string().uuid().required(),
  customer_name: Joi.string().min(1).max(100).required(),
  customer_phone: Joi.string().min(10).max(20).required(),
  pickup_address: Joi.string().min(1).required(),
  pickup_date: Joi.date().min('now').required(),
  duration_hours: Joi.number().integer().min(1).max(24).required()
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled').optional(),
  pickup_address: Joi.string().min(1).optional(),
  pickup_date: Joi.date().min('now').optional(),
  duration_hours: Joi.number().integer().min(1).max(24).optional()
});

// Get all bike bookings or user's bookings
router.get('/', async (req, res) => {
  try {
    const { customer_id } = req.query;
    
    const bookings = await BikeBooking.findAll(customer_id);
    
    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get bike bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bike bookings',
      error: error.message
    });
  }
});

// Get bike booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await BikeBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Bike booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get bike booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bike booking',
      error: error.message
    });
  }
});

// Create new bike booking
router.post('/', async (req, res) => {
  try {
    const { error, value } = bikeBookingSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    // Check if bike exists and is available
    const bike = await Bike.findById(value.bike_id);
    if (!bike || !bike.is_available) {
      return res.status(400).json({
        success: false,
        message: 'Bike is not available for booking'
      });
    }
    
    // Calculate total amount
    const totalAmount = bike.hourly_rate * value.duration_hours;
    
    const bookingData = {
      ...value,
      total_amount: totalAmount,
      status: 'pending'
    };
    
    const booking = await BikeBooking.create(bookingData);
    
    res.status(201).json({
      success: true,
      message: 'Bike booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create bike booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bike booking',
      error: error.message
    });
  }
});

// Update bike booking
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateBookingSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const booking = await BikeBooking.update(id, value);
    
    res.json({
      success: true,
      message: 'Bike booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update bike booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bike booking',
      error: error.message
    });
  }
});

// Cancel bike booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await BikeBooking.update(id, { 
      status: 'cancelled' 
    });
    
    res.json({
      success: true,
      message: 'Bike booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel bike booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel bike booking',
      error: error.message
    });
  }
});

// Assign booking to driver (admin only)
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;
    
    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }
    
    const assignmentId = await BikeBooking.assignToDriver(id, driver_id);
    
    res.json({
      success: true,
      message: 'Bike booking assigned to driver successfully',
      data: { assignment_id: assignmentId }
    });
  } catch (error) {
    console.error('Assign bike booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign bike booking to driver',
      error: error.message
    });
  }
});

module.exports = router;
