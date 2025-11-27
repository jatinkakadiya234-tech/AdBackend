const express = require('express');
const router = express.Router();

// Import Campaign Analytics Controller
const {
  trackCampaignMetrics,
  getCampaignAnalytics,
  getCampaignByPlatform,
  getCampaignByDevice
} = require('../controllers/analytics/campaignAnalyticsController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// CAMPAIGN ANALYTICS ROUTES
// ============================================

// Track campaign metrics
router.post(
  '/track',
  authMiddleware,
  roleMiddleware(['publisher', 'admin']),
  trackCampaignMetrics
);

// Get campaign analytics
router.get(
  '/analytics',
  authMiddleware,
  getCampaignAnalytics
);

// Get campaign performance by platform
router.get(
  '/by-platform',
  authMiddleware,
  getCampaignByPlatform
);

// Get campaign performance by device
router.get(
  '/by-device',
  authMiddleware,
  getCampaignByDevice
);

module.exports = router;
