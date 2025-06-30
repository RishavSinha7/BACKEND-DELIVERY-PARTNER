const express = require('express');
const { Bike } = require('../models/NewSchemaModels');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const bikeSchema = Joi.object({
  model: Joi.string().min(1).max(100).required(),
  brand: Joi.string().min(1).max(50).required(),
  registration_number: Joi.string().min(1).max(20).required(),
  hourly_rate: Joi.number().positive().precision(2).required(),
  daily_rate: Joi.number().positive().precision(2).required(),
  is_available: Joi.boolean().default(true)
});

const updateBikeSchema = Joi.object({
  model: Joi.string().min(1).max(100).optional(),
  brand: Joi.string().min(1).max(50).optional(),
  registration_number: Joi.string().min(1).max(20).optional(),
  hourly_rate: Joi.number().positive().precision(2).optional(),
  daily_rate: Joi.number().positive().precision(2).optional(),
  is_available: Joi.boolean().optional()
});

// Get all available bikes
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.findAll();
    
    res.json({
      success: true,
      data: bikes,
      count: bikes.length
    });
  } catch (error) {
    console.error('Get bikes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bikes',
      error: error.message
    });
  }
});

// Get bike by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const bike = await Bike.findById(id);
    
    if (!bike) {
      return res.status(404).json({
        success: false,
        message: 'Bike not found'
      });
    }
    
    res.json({
      success: true,
      data: bike
    });
  } catch (error) {
    console.error('Get bike error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bike',
      error: error.message
    });
  }
});

// Create new bike (admin only)
router.post('/', async (req, res) => {
  try {
    const { error, value } = bikeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const bike = await Bike.create(value);
    
    res.status(201).json({
      success: true,
      message: 'Bike created successfully',
      data: bike
    });
  } catch (error) {
    console.error('Create bike error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Registration number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create bike',
      error: error.message
    });
  }
});

// Update bike (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateBikeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const bike = await Bike.update(id, value);
    
    res.json({
      success: true,
      message: 'Bike updated successfully',
      data: bike
    });
  } catch (error) {
    console.error('Update bike error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Registration number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update bike',
      error: error.message
    });
  }
});

// Delete bike (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await Bike.delete(id);
    
    res.json({
      success: true,
      message: 'Bike deleted successfully'
    });
  } catch (error) {
    console.error('Delete bike error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bike',
      error: error.message
    });
  }
});

module.exports = router;
