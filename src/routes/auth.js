const express = require('express');
const rateLimit = require('express-rate-limit');
const { supabase } = require('../models');
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

    // Check if email already exists (if provided)
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
      password_hash: password, // Will be hashed automatically by hook
      is_driver: isDriver,
      email
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      isDriver: user.is_driver
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: user.toJSON(),
        token,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`
      });
    }

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
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
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

    // Check driver status if specified
    if (isDriver && !user.is_driver) {
      return res.status(403).json({
        success: false,
        message: 'Driver access not available for this account. Please sign up as a driver.'
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      phone: user.phone,
      isDriver: user.is_driver
    });

    res.json({
      success: true,
      message: 'Sign in successful',
      data: {
        user: user.toJSON(),
        token,
        tokenType: 'Bearer'
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

// Get Current User Profile
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
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

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
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

// Forgot Password
router.post('/forgot-password', strictLimiter, async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { phone } = value;

    const user = await User.findOne({ phone });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If the phone number exists, you will receive a reset link'
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save();

    // TODO: Send SMS with reset token
    // For now, just return success (in production, send SMS)
    console.log(`Reset token for ${phone}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset instructions sent to your phone'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset Password
router.post('/reset-password', strictLimiter, async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { token, password } = value;

    // Hash the token
    const hashedToken = require('crypto').createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token removal, but can be tracked server-side)
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success as logout is handled client-side
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh Token (for future implementation)
router.post('/refresh', async (req, res) => {
  try {
    // TODO: Implement refresh token logic
    res.status(501).json({
      success: false,
      message: 'Refresh token functionality not implemented yet'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
