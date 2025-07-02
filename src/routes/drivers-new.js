const express = require('express');
const { Driver, DriverAssignment } = require('../models');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const driverSchema = Joi.object({
  profile_id: Joi.string().uuid().required(),
  driver_name: Joi.string().min(1).max(100).required(),
  phone: Joi.string().min(10).max(20).required(),
  license_number: Joi.string().min(1).max(50).required(),
  vehicle_type: Joi.string().valid('bike', 'truck').required(),
  vehicle_registration: Joi.string().min(1).max(20).required(),
  current_status: Joi.string().valid('available', 'busy', 'offline').default('available')
});

const updateDriverSchema = Joi.object({
  driver_name: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().min(10).max(20).optional(),
  license_number: Joi.string().min(1).max(50).optional(),
  vehicle_type: Joi.string().valid('bike', 'truck').optional(),
  vehicle_registration: Joi.string().min(1).max(20).optional(),
  current_status: Joi.string().valid('available', 'busy', 'offline').optional()
});

const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const { vehicle_type, status } = req.query;
    let drivers;
    
    if (status === 'available' && vehicle_type) {
      drivers = await Driver.getAvailableDrivers(vehicle_type);
    } else {
      drivers = await Driver.findAll();
    }
    
    res.json({
      success: true,
      data: drivers,
      count: drivers.length
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message
    });
  }
});

// Get driver by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findById(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver',
      error: error.message
    });
  }
});

// Get driver by profile ID
router.get('/profile/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const driver = await Driver.findByProfileId(profileId);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }
    
    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('Get driver by profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver profile',
      error: error.message
    });
  }
});

// Create new driver
router.post('/', async (req, res) => {
  try {
    const { error, value } = driverSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const driver = await Driver.create(value);
    
    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver
    });
  } catch (error) {
    console.error('Create driver error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Driver with this profile already exists or vehicle registration is duplicate'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create driver',
      error: error.message
    });
  }
});

// Update driver
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateDriverSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const driver = await Driver.update(id, value);
    
    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver',
      error: error.message
    });
  }
});

// Update driver location
router.post('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = locationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const result = await Driver.updateLocation(id, value.latitude, value.longitude);
    
    res.json({
      success: true,
      message: 'Driver location updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Update driver location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver location',
      error: error.message
    });
  }
});

// Get driver assignments
router.get('/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const assignments = await DriverAssignment.findByDriverId(id);
    
    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Get driver assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver assignments',
      error: error.message
    });
  }
});

// Verify OTP for assignment
router.post('/assignments/:assignmentId/verify-otp', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }
    
    const result = await DriverAssignment.verifyOtp(assignmentId, otp);
    
    if (result) {
      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// Mark assignment as completed
router.post('/assignments/:assignmentId/complete', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await DriverAssignment.markCompleted(assignmentId);
    
    res.json({
      success: true,
      message: 'Assignment marked as completed',
      data: assignment
    });
  } catch (error) {
    console.error('Complete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete assignment',
      error: error.message
    });
  }
});

module.exports = router;
