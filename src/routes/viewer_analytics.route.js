const express = require('express');
const router = express.Router();

// Import Viewer Analytics Controller
const {
  trackImpression,
  trackClick,
  getViewerAnalytics,
  getEarningsSummary,
  getTopCampaigns
} = require('../controllers/analytics/viewerAnalyticsController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// VIEWER ANALYTICS ROUTES
// ============================================

// Track impression
router.post(
  '/impression',
  authMiddleware,
  roleMiddleware(['viewer']),
  trackImpression
);

// Track click
router.post(
  '/click',
  authMiddleware,
  roleMiddleware(['viewer']),
  trackClick
);

// Get analytics
router.get(
  '/analytics',
  authMiddleware,
  roleMiddleware(['viewer']),
  getViewerAnalytics
);

// Get earnings summary
router.get(
  '/earnings-summary',
  authMiddleware,
  roleMiddleware(['viewer']),
  getEarningsSummary
);

// Get top campaigns
router.get(
  '/top-campaigns',
  authMiddleware,
  roleMiddleware(['viewer']),
  getTopCampaigns
);

module.exports = router;
