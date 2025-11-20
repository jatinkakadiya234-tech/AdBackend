const express = require('express');
const router = express.Router();
const CampaignController = require('./CampaignController');
const  authenticateToken  = require('../Config/Midelwere');
const upload = require('../Config/Multer');

// Public routes
router.get('/list', CampaignController.getAllCampaigns);

// Admin routes
router.get('/all', authenticateToken, CampaignController.getAllCampaigns);

// Publisher routes
router.post('/create', authenticateToken, upload.single('adImage'), CampaignController.createCampaign);
router.get('/my-campaigns', authenticateToken, CampaignController.getPublisherCampaigns);
router.get('/user-campaigns', authenticateToken, CampaignController.getPublisherCampaigns);
router.post('/:id/activate', authenticateToken, CampaignController.activateCampaign);
router.put('/:id/toggle-status', authenticateToken, CampaignController.toggleCampaignStatus);
router.post('/:id/toggle-status', authenticateToken, CampaignController.toggleCampaignStatus);
router.get('/:id/analytics', authenticateToken, CampaignController.getCampaignAnalytics);
router.get('/:id', authenticateToken, CampaignController.getCampaign);
router.put('/:id', authenticateToken, CampaignController.updateCampaign);
router.delete('/:id', authenticateToken, CampaignController.deleteCampaign);

// Tracking routes
const CampaignTracking = require('./CampaignTracking');
router.post('/:id/click', CampaignTracking.trackClick);
router.post('/:id/impression', CampaignTracking.trackImpression);

// Admin routes
router.get('/pending', authenticateToken, CampaignController.getPendingCampaigns);
router.post('/:id/approve', authenticateToken, CampaignController.approveCampaign);
router.post('/:id/reject', authenticateToken, CampaignController.rejectCampaign);
router.post('/:id/submit-review', authenticateToken, CampaignController.submitForReview);
router.delete('/admin/:id', authenticateToken, CampaignController.adminDeleteCampaign);

module.exports = router;