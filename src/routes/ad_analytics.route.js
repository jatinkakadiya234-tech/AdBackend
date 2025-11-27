const express = require('express');
const router = express.Router();

// Import Ad Analytics Controller
const {
  trackAdMetrics,
  getAdAnalytics,
  getAdPerformanceSummary
} = require('../controllers/analytics/adAnalyticsController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// AD ANALYTICS ROUTES
// ============================================

// Track ad metrics
router.post(
  '/track',
  authMiddleware,
  roleMiddleware(['publisher', 'admin']),
  trackAdMetrics
);

// Get ad analytics
router.get(
  '/analytics',
  authMiddleware,
  getAdAnalytics
);

// Get ad performance summary
router.get(
  '/summary',
  authMiddleware,
  getAdPerformanceSummary
);

module.exports = router;
