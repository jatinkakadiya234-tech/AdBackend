const express = require('express');
const router = express.Router();

// Import Ad Controller
const {
  createAd,
  updateAd,
  getAdsByCampaign,
  getAdDetails,
  deleteAd
} = require('../controllers/adController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// AD ROUTES
// ============================================

// Create new ad
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['publisher']),
  createAd
);

// Get ads by campaign
router.get(
  '/campaign/:campaignId',
  authMiddleware,
  roleMiddleware(['publisher']),
  getAdsByCampaign
);

// Get ad details
router.get(
  '/:adId',
  authMiddleware,
  getAdDetails
);

// Update ad
router.put(
  '/:adId',
  authMiddleware,
  roleMiddleware(['publisher']),
  updateAd
);

// Delete ad
router.delete(
  '/:adId',
  authMiddleware,
  roleMiddleware(['publisher']),
  deleteAd
);

module.exports = router;
