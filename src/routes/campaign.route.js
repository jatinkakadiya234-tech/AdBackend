const express = require('express');
const router = express.Router();

// Import Campaign Controller
const {
  createCampaign,
  updateCampaign,
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
  submitForReview
} = require('../controllers/campaignController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// CAMPAIGN ROUTES
// ============================================

// Create new campaign
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['publisher']),
  createCampaign
);

// Get campaigns (with pagination)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['publisher']),
  getCampaigns
);

// Update campaign
router.put(
  '/:campaignId',
  authMiddleware,
  roleMiddleware(['publisher']),
  updateCampaign
);

// Pause campaign
router.post(
  '/:campaignId/pause',
  authMiddleware,
  roleMiddleware(['publisher']),
  pauseCampaign
);

// Resume campaign
router.post(
  '/:campaignId/resume',
  authMiddleware,
  roleMiddleware(['publisher']),
  resumeCampaign
);

// Submit campaign for review
router.post(
  '/:campaignId/submit-review',
  authMiddleware,
  roleMiddleware(['publisher']),
  submitForReview
);

module.exports = router;
