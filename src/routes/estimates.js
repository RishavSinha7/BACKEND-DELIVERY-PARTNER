const express = require('express');
const Joi = require('joi');
const { calculateEstimate, calculateSurgeMultiplier } = require('../utils/pricing');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schema for estimate request
const estimateSchema = Joi.object({
  serviceType: Joi.string().valid('two-wheeler', 'truck', 'intercity', 'packers-movers').required(),
  pickupLocation: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required()
  }).required(),
  dropLocation: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).required()
  }).required(),
  options: Joi.object({
    loadingRequired: Joi.boolean().default(false),
    hours: Joi.number().min(1).max(24).optional(),
    items: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      weight: Joi.number().positive().optional(),
      dimensions: Joi.object({
        length: Joi.number().positive(),
        width: Joi.number().positive(),
        height: Joi.number().positive()
      }).optional()
    })).optional(),
    scheduledAt: Joi.date().min('now').optional()
  }).optional()
});

// Get price estimate
router.post('/calculate', optionalAuth, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = estimateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }

    const { serviceType, pickupLocation, dropLocation, options = {} } = value;

    // Calculate surge multiplier based on current demand
    const currentTime = new Date();
    const surgeMultiplier = calculateSurgeMultiplier(serviceType, currentTime, 'normal');
    options.surgeMultiplier = surgeMultiplier;

    // Calculate estimate
    const estimate = calculateEstimate(
      serviceType,
      pickupLocation.coordinates,
      dropLocation.coordinates,
      options
    );

    if (!estimate.success) {
      return res.status(400).json({
        success: false,
        message: estimate.error
      });
    }

    // Add additional metadata
    estimate.estimate.pickupLocation = pickupLocation;
    estimate.estimate.dropLocation = dropLocation;
    estimate.estimate.requestId = require('crypto').randomBytes(16).toString('hex');

    res.json({
      success: true,
      data: estimate.estimate
    });

  } catch (error) {
    console.error('Calculate estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get service types and their details
router.get('/service-types', (req, res) => {
  try {
    const serviceTypes = {
      'two-wheeler': {
        name: 'Two Wheeler',
        description: 'Quick delivery with bikes or scooters',
        icon: '🏍️',
        features: ['Fast delivery', 'Small packages', 'City coverage'],
        maxWeight: '10 kg',
        estimatedTime: '20-45 mins'
      },
      'truck': {
        name: 'Truck',
        description: 'Heavy goods transportation',
        icon: '🚚',
        features: ['Heavy items', 'Furniture', 'Loading assistance'],
        maxWeight: '1000 kg',
        estimatedTime: '1-3 hours'
      },
      'intercity': {
        name: 'Intercity',
        description: 'Long distance transportation',
        icon: '🚛',
        features: ['Long distance', 'Multi-day trips', 'Professional drivers'],
        maxWeight: '2000 kg',
        estimatedTime: '1-3 days'
      },
      'packers-movers': {
        name: 'Packers & Movers',
        description: 'Complete home/office relocation',
        icon: '📦',
        features: ['Packing service', 'Professional movers', 'Insurance coverage'],
        maxWeight: 'No limit',
        estimatedTime: '4-8 hours'
      }
    };

    res.json({
      success: true,
      data: serviceTypes
    });

  } catch (error) {
    console.error('Get service types error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pricing details for a specific service type
router.get('/pricing/:serviceType', (req, res) => {
  try {
    const { serviceType } = req.params;
    
    const pricingDetails = {
      'two-wheeler': {
        baseFare: 30,
        description: 'Base fare for pickup',
        perKm: 8,
        perKmDescription: 'Per kilometer charge',
        perMinute: 2,
        perMinuteDescription: 'Waiting time charge',
        minimumFare: 50,
        features: [
          'Instant booking',
          'Real-time tracking',
          'Cash/Digital payment'
        ]
      },
      'truck': {
        baseFare: 150,
        description: 'Base fare for pickup',
        perKm: 25,
        perKmDescription: 'Per kilometer charge',
        loadingCharges: 100,
        loadingDescription: 'Loading/unloading assistance',
        minimumFare: 300,
        features: [
          'Professional drivers',
          'Loading assistance',
          'Secure transportation'
        ]
      },
      'intercity': {
        baseFare: 500,
        description: 'Base fare for pickup',
        perKm: 15,
        perKmDescription: 'Per kilometer charge',
        driverAllowance: 500,
        driverAllowanceDescription: 'Per day driver allowance',
        minimumFare: 1500,
        features: [
          'Long distance expert drivers',
          'Toll charges included',
          '24/7 support'
        ]
      },
      'packers-movers': {
        baseFare: 1000,
        description: 'Base service charge',
        perKm: 20,
        perKmDescription: 'Transportation charge per km',
        laborCharges: 300,
        laborDescription: 'Labor charges for packing/moving',
        packingCharges: 500,
        packingDescription: 'Packing materials and service',
        minimumFare: 2000,
        features: [
          'Professional packing',
          'Furniture disassembly/assembly',
          'Insurance coverage available'
        ]
      }
    };

    const pricing = pricingDetails[serviceType];
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found'
      });
    }

    res.json({
      success: true,
      data: {
        serviceType,
        pricing
      }
    });

  } catch (error) {
    console.error('Get pricing details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current surge pricing information
router.get('/surge/:serviceType', (req, res) => {
  try {
    const { serviceType } = req.params;
    const { latitude, longitude } = req.query;

    // Validate service type
    const validServiceTypes = ['two-wheeler', 'truck', 'intercity', 'packers-movers'];
    if (!validServiceTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type'
      });
    }

    const currentTime = new Date();
    
    // In a real application, you would determine demand level based on:
    // - Number of active drivers in the area
    // - Number of pending requests
    // - Historical data for the time/location
    // - Weather conditions, etc.
    
    // For demo purposes, we'll simulate demand levels
    const hour = currentTime.getHours();
    let demandLevel = 'normal';
    
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21)) {
      demandLevel = 'high'; // Peak hours
    } else if (hour >= 23 || hour <= 5) {
      demandLevel = 'high'; // Late night
    }

    const surgeMultiplier = calculateSurgeMultiplier(serviceType, currentTime, demandLevel);

    res.json({
      success: true,
      data: {
        serviceType,
        surgeMultiplier,
        demandLevel,
        message: surgeMultiplier > 1.0 
          ? `High demand area - ${surgeMultiplier}x pricing` 
          : 'Normal pricing',
        lastUpdated: currentTime.toISOString()
      }
    });

  } catch (error) {
    console.error('Get surge pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
