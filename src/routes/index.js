const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const publisherProfileRoutes = require('./publisherProfileRoutes');
const campaignRoutes = require('./campaignRoutes');
const adRoutes = require('./adRoutes');
const adUnitRoutes = require('./adUnitRoutes');
const viewerAnalyticsRoutes = require('./viewerAnalyticsRoutes');
const campaignAnalyticsRoutes = require('./campaignAnalyticsRoutes');
const adAnalyticsRoutes = require('./adAnalyticsRoutes');
const adUnitAnalyticsRoutes = require('./adUnitAnalyticsRoutes');
const publisherAnalyticsRoutes = require('./publisherAnalyticsRoutes');
const ipTrackingRoutes = require('./ipTrackingRoutes');
const viewerProfileRoutes = require('./viewerProfileRoutes');

// ============================================
// MOUNT AUTHENTICATION ROUTES (Public)
// ============================================
router.use('/auth', authRoutes);

// ============================================
// MOUNT USER & PROFILE ROUTES
// ============================================
router.use('/users', userRoutes);
router.use('/publisher', publisherProfileRoutes);
router.use('/viewer-profile', viewerProfileRoutes);

// ============================================
// MOUNT CAMPAIGN & AD ROUTES
// ============================================
router.use('/campaigns', campaignRoutes);
router.use('/ads', adRoutes);
router.use('/ad-units', adUnitRoutes);

// ============================================
// MOUNT ANALYTICS ROUTES
// ============================================
router.use('/analytics/viewer', viewerAnalyticsRoutes);
router.use('/analytics/campaign', campaignAnalyticsRoutes);
router.use('/analytics/ad', adAnalyticsRoutes);
router.use('/analytics/ad-unit', adUnitAnalyticsRoutes);
router.use('/analytics/publisher', publisherAnalyticsRoutes);
router.use('/analytics/ip', ipTrackingRoutes);

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

router.get('/info', (req, res) => {
  res.json({
    success: true,
    api: 'AdTech Complete Platform API',
    version: '1.0.0',
    auth: '/api/auth'
  });
});

module.exports = router;
