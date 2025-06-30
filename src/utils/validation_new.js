const Joi = require('joi');

// Auth validation schemas
const signUpSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),
  phone: Joi.string().min(10).max(15).pattern(/^[0-9]+$/).required(),
  password: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  isDriver: Joi.boolean().default(false),
  email: Joi.string().email().optional()
});

const signInSchema = Joi.object({
  phone: Joi.string().min(10).max(15).pattern(/^[0-9]+$/).required(),
  password: Joi.string().min(6).required(),
  isDriver: Joi.boolean().default(false)
});

// Profile validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().optional(),
  email: Joi.string().email().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional()
  }).optional()
});

// Booking validation schemas
const createBookingSchema = Joi.object({
  serviceType: Joi.string().valid('two-wheeler', 'truck', 'intercity', 'packers-movers').required(),
  pickupLocation: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required()
    }).required()
  }).required(),
  dropLocation: Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required()
    }).required()
  }).required(),
  scheduledAt: Joi.date().min('now').optional(),
  notes: Joi.string().max(500).optional(),
  vehicleType: Joi.string().optional(),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object({
      length: Joi.number().positive(),
      width: Joi.number().positive(),
      height: Joi.number().positive()
    }).optional()
  })).optional()
});

// Driver validation schemas
const driverProfileSchema = Joi.object({
  licenseNumber: Joi.string().required(),
  vehicleType: Joi.string().valid('bike', 'car', 'van', 'truck', 'tempo').required(),
  vehicleNumber: Joi.string().required(),
  vehicleModel: Joi.string().required(),
  experienceYears: Joi.number().min(0).max(50).required(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    relation: Joi.string().required()
  }).required()
});

// Password reset schemas
const forgotPasswordSchema = Joi.object({
  phone: Joi.string().min(10).max(15).pattern(/^[0-9]+$/).required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

module.exports = {
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  createBookingSchema,
  driverProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
};
