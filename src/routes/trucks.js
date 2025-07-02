const express = require('express');
const { Truck } = require('../models');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const truckSchema = Joi.object({
  model: Joi.string().min(1).max(100).required(),
  brand: Joi.string().min(1).max(50).required(),
  registration_number: Joi.string().min(1).max(20).required(),
  load_capacity_kg: Joi.number().integer().positive().required(),
  hourly_rate: Joi.number().positive().precision(2).required(),
  daily_rate: Joi.number().positive().precision(2).required(),
  is_available: Joi.boolean().default(true)
});

const updateTruckSchema = Joi.object({
  model: Joi.string().min(1).max(100).optional(),
  brand: Joi.string().min(1).max(50).optional(),
  registration_number: Joi.string().min(1).max(20).optional(),
  load_capacity_kg: Joi.number().integer().positive().optional(),
  hourly_rate: Joi.number().positive().precision(2).optional(),
  daily_rate: Joi.number().positive().precision(2).optional(),
  is_available: Joi.boolean().optional()
});

// Get all available trucks
router.get('/', async (req, res) => {
  try {
    const trucks = await Truck.findAll();
    
    res.json({
      success: true,
      data: trucks,
      count: trucks.length
    });
  } catch (error) {
    console.error('Get trucks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trucks',
      error: error.message
    });
  }
});

// Get truck by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const truck = await Truck.findById(id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    res.json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Get truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch truck',
      error: error.message
    });
  }
});

// Create new truck (admin only)
router.post('/', async (req, res) => {
  try {
    const { error, value } = truckSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const truck = await Truck.create(value);
    
    res.status(201).json({
      success: true,
      message: 'Truck created successfully',
      data: truck
    });
  } catch (error) {
    console.error('Create truck error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Registration number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create truck',
      error: error.message
    });
  }
});

// Update truck (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTruckSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const truck = await Truck.update(id, value);
    
    res.json({
      success: true,
      message: 'Truck updated successfully',
      data: truck
    });
  } catch (error) {
    console.error('Update truck error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Registration number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update truck',
      error: error.message
    });
  }
});

// Delete truck (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await Truck.delete(id);
    
    res.json({
      success: true,
      message: 'Truck deleted successfully'
    });
  } catch (error) {
    console.error('Delete truck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete truck',
      error: error.message
    });
  }
});

module.exports = router;
