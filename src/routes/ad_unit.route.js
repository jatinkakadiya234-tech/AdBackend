const express = require('express');
const router = express.Router();

// Import Ad Unit Controller
const {
  createAdUnit,
  getAdUnits,
  updateAdUnit,
  verifyAdUnit,
  getAdUnitStats,
  deleteAdUnit
} = require('../controllers/adUnitController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// AD UNIT ROUTES
// ============================================

// Create new ad unit
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['viewer']),
  createAdUnit
);

// Get ad units
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['viewer']),
  getAdUnits
);

// Update ad unit
router.put(
  '/:adUnitId',
  authMiddleware,
  roleMiddleware(['viewer']),
  updateAdUnit
);

// Verify ad unit
router.post(
  '/:adUnitId/verify',
  authMiddleware,
  roleMiddleware(['viewer']),
  verifyAdUnit
);

// Get ad unit statistics
router.get(
  '/:adUnitId/stats',
  authMiddleware,
  roleMiddleware(['viewer']),
  getAdUnitStats
);

// Delete ad unit
router.delete(
  '/:adUnitId',
  authMiddleware,
  roleMiddleware(['viewer']),
  deleteAdUnit
);

module.exports = router;
