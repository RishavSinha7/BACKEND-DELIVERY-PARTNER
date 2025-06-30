const express = require('express');
const User = require('../models/User');
const { updateProfileSchema } = require('../utils/validation');
const { authenticate, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
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

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }

    const updates = value;
    
    // Check if email is being updated and if it's already taken
    if (updates.email && updates.email !== req.user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
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

// Get user by ID (public profile)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('name profileImage isDriver createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
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

// Upload profile image
router.post('/profile/image', authenticate, async (req, res) => {
  try {
    // TODO: Implement file upload with multer and cloudinary
    res.status(501).json({
      success: false,
      message: 'Profile image upload not implemented yet'
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user statistics
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    
    const userId = req.user._id;
    const isDriver = req.user.isDriver;

    let stats = {};

    if (isDriver) {
      // Driver statistics
      const totalBookings = await Booking.countDocuments({ driver: userId });
      const completedBookings = await Booking.countDocuments({ 
        driver: userId, 
        status: 'delivered' 
      });
      const totalEarnings = await Booking.aggregate([
        { $match: { driver: userId, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]);

      const ratings = await Booking.aggregate([
        { $match: { driver: userId, 'rating.customer.rating': { $exists: true } } },
        { $group: { 
          _id: null, 
          avgRating: { $avg: '$rating.customer.rating' },
          totalRatings: { $sum: 1 }
        }}
      ]);

      stats = {
        totalBookings,
        completedBookings,
        totalEarnings: totalEarnings[0]?.total || 0,
        averageRating: ratings[0]?.avgRating || 0,
        totalRatings: ratings[0]?.totalRatings || 0,
        successRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : 0
      };
    } else {
      // Customer statistics
      const totalBookings = await Booking.countDocuments({ customer: userId });
      const completedBookings = await Booking.countDocuments({ 
        customer: userId, 
        status: 'delivered' 
      });
      const totalSpent = await Booking.aggregate([
        { $match: { customer: userId, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]);

      stats = {
        totalBookings,
        completedBookings,
        totalSpent: totalSpent[0]?.total || 0,
        memberSince: req.user.createdAt
      };
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update device token for push notifications
router.put('/device-token', authenticate, async (req, res) => {
  try {
    const { token, device } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Remove existing token for this device
    user.deviceTokens = user.deviceTokens.filter(dt => dt.device !== device);
    
    // Add new token
    user.deviceTokens.push({
      token,
      device: device || 'unknown',
      lastUsed: new Date()
    });

    // Keep only the last 5 tokens
    if (user.deviceTokens.length > 5) {
      user.deviceTokens = user.deviceTokens.slice(-5);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Device token updated successfully'
    });

  } catch (error) {
    console.error('Update device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user preferences
router.get('/preferences', authenticate, async (req, res) => {
  try {
    // TODO: Implement user preferences model and logic
    res.json({
      success: true,
      data: {
        notifications: {
          push: true,
          email: true,
          sms: false
        },
        privacy: {
          shareLocation: true,
          showOnlineStatus: true
        },
        language: 'en',
        theme: 'light'
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user preferences
router.put('/preferences', authenticate, async (req, res) => {
  try {
    // TODO: Implement user preferences update logic
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
