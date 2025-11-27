const express = require('express');
const router = express.Router();

// Import IP Tracking Controller
const {
  recordClick,
  getIPTrackingData,
  getClickHistory
} = require('../controllers/analytics/ipTrackingController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// IP TRACKING ROUTES
// ============================================

// Record IP click (public - no auth needed)
router.post(
  '/record-click',
  recordClick
);

// Get IP tracking data (admin only)
router.get(
  '/tracking-data',
  authMiddleware,
  roleMiddleware(['admin']),
  getIPTrackingData
);

// Get IP click history (admin only)
router.get(
  '/click-history',
  authMiddleware,
  roleMiddleware(['admin']),
  getClickHistory
);

module.exports = router;
