const express = require('express');
const router = express.Router();

// Import Viewer Profile Controller
const {
  createOrGetProfile,
  addPlatform,
  verifyPlatform,
  updatePaymentSettings,
  updateTaxInfo,
  getViewerProfile,
  getPlatformStats
} = require('../controllers/profile/viewerProfileController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// VIEWER PROFILE ROUTES
// ============================================

// Create or get profile
router.get(
  '/profile',
  authMiddleware,
  roleMiddleware(['viewer']),
  createOrGetProfile
);

// Get profile details
router.get(
  '/profile-details',
  authMiddleware,
  roleMiddleware(['viewer']),
  getViewerProfile
);

// Add platform
router.post(
  '/platform',
  authMiddleware,
  roleMiddleware(['viewer']),
  addPlatform
);

// Verify platform
router.post(
  '/platform/verify',
  authMiddleware,
  roleMiddleware(['viewer']),
  verifyPlatform
);

// Get platform stats
router.get(
  '/platform/stats',
  authMiddleware,
  roleMiddleware(['viewer']),
  getPlatformStats
);

// Update payment settings
router.put(
  '/payment-settings',
  authMiddleware,
  roleMiddleware(['viewer']),
  updatePaymentSettings
);

// Update tax information
router.put(
  '/tax-info',
  authMiddleware,
  roleMiddleware(['viewer']),
  updateTaxInfo
);

module.exports = router;
