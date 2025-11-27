const express = require('express');
const router = express.Router();

// Import Ad Unit Analytics Controller
const {
  trackAdUnitMetrics,
  getAdUnitAnalytics,
  getRevenueSummary
} = require('../controllers/analytics/adUnitAnalyticsController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// AD UNIT ANALYTICS ROUTES
// ============================================

// Track ad unit metrics
router.post(
  '/track',
  authMiddleware,
  roleMiddleware(['viewer', 'admin']),
  trackAdUnitMetrics
);

// Get ad unit analytics
router.get(
  '/analytics',
  authMiddleware,
  roleMiddleware(['viewer', 'admin']),
  getAdUnitAnalytics
);

// Get revenue summary
router.get(
  '/revenue',
  authMiddleware,
  roleMiddleware(['viewer', 'admin']),
  getRevenueSummary
);

module.exports = router;
