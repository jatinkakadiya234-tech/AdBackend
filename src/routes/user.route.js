const express = require('express');
const router = express.Router();

// Import User Controller
const {
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
  suspendUser,
  activateSuspendedUser
} = require('../controllers/userController');

// Import Middleware
const { authMiddleware, roleMiddleware, adminMiddleware } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (No Auth)
// ============================================

// Note: Login/Register handled in separate auth routes

// ============================================
// AUTHENTICATED USER ROUTES
// ============================================

// Get user profile
router.get(
  '/profile',
  authMiddleware,
  getProfile
);

// Update user profile
router.put(
  '/profile',
  authMiddleware,
  updateProfile
);

// Change password
router.post(
  '/change-password',
  authMiddleware,
  changePassword
);

// Update user preferences
router.put(
  '/preferences',
  authMiddleware,
  updatePreferences
);

// ============================================
// ADMIN ROUTES
// ============================================

// Suspend user (Admin only)
router.post(
  '/:userId/suspend',
  authMiddleware,
  adminMiddleware,
  suspendUser
);

// Activate suspended user (Admin only)
router.post(
  '/:userId/activate',
  authMiddleware,
  adminMiddleware,
  activateSuspendedUser
);

module.exports = router;
