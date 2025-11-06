const express = require('express');
const AdController = require('./AdController');
const authMiddleware = require('../Config/Middleware');
const AdRouter = express.Router();

AdRouter.post('/create', authMiddleware, AdController.createAd);
AdRouter.get('/embed/:id', AdController.getEmbedCode);
AdRouter.get('/list', authMiddleware, AdController.getAds);
AdRouter.put('/update/:id', authMiddleware, AdController.updateAd);
AdRouter.delete('/delete/:id', authMiddleware, AdController.deleteAd);
AdRouter.get('/click/:id', AdController.trackClick);
AdRouter.get('/impression/:id', AdController.trackImpression);
AdRouter.post('/reward/:id', authMiddleware, AdController.trackReward);
AdRouter.get('/mobile/:placementId', AdController.getAdForMobileSDK);

module.exports = AdRouter;
