const express = require('express');
const router = express.Router();

// Import Publisher Analytics Controller
const {
  trackPublisherMetrics,
  getPublisherAnalytics,
  getPublisherDashboard
} = require('../controllers/analytics/publisherAnalyticsController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// PUBLISHER ANALYTICS ROUTES
// ============================================

// Track publisher metrics
router.post(
  '/track',
  authMiddleware,
  roleMiddleware(['publisher', 'admin']),
  trackPublisherMetrics
);

// Get publisher analytics
router.get(
  '/analytics',
  authMiddleware,
  roleMiddleware(['publisher', 'admin']),
  getPublisherAnalytics
);

// Get publisher dashboard
router.get(
  '/dashboard',
  authMiddleware,
  roleMiddleware(['publisher', 'admin']),
  getPublisherDashboard
);

module.exports = router;
