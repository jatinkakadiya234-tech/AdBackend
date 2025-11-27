const express = require('express');
const router = express.Router();

// Import Publisher Controller
const {
  createOrGetProfile,
  updateCompanyInfo,
  updatePlatformDetails,
  updatePaymentSettings,
  submitKYCDocuments,
  getKYCStatus
} = require('../controllers/publisherController');

// Import Middleware
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// ============================================
// PUBLISHER PROFILE ROUTES
// ============================================

// Create or get publisher profile
router.get(
  '/profile',
  authMiddleware,
  roleMiddleware(['publisher']),
  createOrGetProfile
);

// Update company information
router.put(
  '/company-info',
  authMiddleware,
  roleMiddleware(['publisher']),
  updateCompanyInfo
);

// Update platform details
router.put(
  '/platform-details',
  authMiddleware,
  roleMiddleware(['publisher']),
  updatePlatformDetails
);

// Update payment settings
router.put(
  '/payment-settings',
  authMiddleware,
  roleMiddleware(['publisher']),
  updatePaymentSettings
);

// Submit KYC documents
router.post(
  '/kyc-submit',
  authMiddleware,
  roleMiddleware(['publisher']),
  submitKYCDocuments
);

// Get KYC status
router.get(
  '/kyc-status',
  authMiddleware,
  roleMiddleware(['publisher']),
  getKYCStatus
);

module.exports = router;
