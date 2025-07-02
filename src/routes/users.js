const express = require('express');
const { supabase } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User profile endpoint',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
});

module.exports = router;
