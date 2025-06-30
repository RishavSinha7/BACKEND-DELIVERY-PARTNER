const express = require('express');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const { signUpSchema, signInSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../utils/validation');
const { generateToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many failed attempts, please try again after an hour.'
  }
});

// Sign Up Route
router.post('/signup', authLimiter, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = signUpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { name, phone, password, isDriver, email } = value;

    // Check if user already exists
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Check email if provided
    if (email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Create new user
    const user = await User.create({
      name,
      phone,
      passwordHash: password, // Will be hashed in the model hook
      isDriver,
      email
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sign In Route
router.post('/signin', authLimiter, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = signInSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { phone, password, isDriver } = value;

    // Find user by phone
    const user = await User.findByPhone(phone);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check if user type matches
    if (user.isDriver !== isDriver) {
      return res.status(401).json({
        success: false,
        message: `Please sign in as ${user.isDriver ? 'driver' : 'customer'}`
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Sign in successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Current User
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change Password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { currentPassword, newPassword } = value;
    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed in the model hook
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token removal, server-side can be enhanced with token blacklisting)
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
