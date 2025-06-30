const express = require('express');
const { TruckBooking, Truck } = require('../models/NewSchemaModels');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const truckBookingSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  truck_id: Joi.string().uuid().required(),
  customer_name: Joi.string().min(1).max(100).required(),
  customer_phone: Joi.string().min(10).max(20).required(),
  pickup_address: Joi.string().min(1).required(),
  delivery_address: Joi.string().min(1).required(),
  pickup_date: Joi.date().min('now').required(),
  estimated_duration_hours: Joi.number().integer().min(1).max(48).optional()
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled').optional(),
  pickup_address: Joi.string().min(1).optional(),
  delivery_address: Joi.string().min(1).optional(),
  pickup_date: Joi.date().min('now').optional(),
  estimated_duration_hours: Joi.number().integer().min(1).max(48).optional()
});

// Get all truck bookings or user's bookings
router.get('/', async (req, res) => {
  try {
    const { customer_id } = req.query;
    
    const bookings = await TruckBooking.findAll(customer_id);
    
    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get truck bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch truck bookings',
      error: error.message
    });
  }
});

// Get truck booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await TruckBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Truck booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get truck booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch truck booking',
      error: error.message
    });
  }
});

// Create new truck booking
router.post('/', async (req, res) => {
  try {
    const { error, value } = truckBookingSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    // Check if truck exists and is available
    const truck = await Truck.findById(value.truck_id);
    if (!truck || !truck.is_available) {
      return res.status(400).json({
        success: false,
        message: 'Truck is not available for booking'
      });
    }
    
    // Calculate total amount (base rate + estimated duration)
    const estimatedHours = value.estimated_duration_hours || 4; // Default 4 hours
    const totalAmount = truck.hourly_rate * estimatedHours;
    
    const bookingData = {
      ...value,
      estimated_duration_hours: estimatedHours,
      total_amount: totalAmount,
      status: 'pending'
    };
    
    const booking = await TruckBooking.create(bookingData);
    
    res.status(201).json({
      success: true,
      message: 'Truck booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create truck booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create truck booking',
      error: error.message
    });
  }
});

// Update truck booking
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
    
    const booking = await TruckBooking.update(id, value);
    
    res.json({
      success: true,
      message: 'Truck booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update truck booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update truck booking',
      error: error.message
    });
  }
});

// Cancel truck booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await TruckBooking.update(id, { 
      status: 'cancelled' 
    });
    
    res.json({
      success: true,
      message: 'Truck booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel truck booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel truck booking',
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
    
    const assignmentId = await TruckBooking.assignToDriver(id, driver_id);
    
    res.json({
      success: true,
      message: 'Truck booking assigned to driver successfully',
      data: { assignment_id: assignmentId }
    });
  } catch (error) {
    console.error('Assign truck booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign truck booking to driver',
      error: error.message
    });
  }
});

module.exports = router;
