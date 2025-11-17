const express = require('express');
const AdController = require('./AdController');
const ImpressionController = require('./ImpressionController');
const authmiddleware = require('../Config/Midelwere');
const upload = require('../Config/multer');
const Adrouter = express.Router();

// Ad Management Routes
Adrouter.post('/create', upload.single('file'), AdController.createAd);
Adrouter.get('/ads', authmiddleware, AdController.getAds);
Adrouter.get('/all', AdController.getAllAds);
Adrouter.put('/update/:id', authmiddleware, upload.single('file'), AdController.updateAd);
Adrouter.delete('/delete/:id', authmiddleware, AdController.deleteAd);

// Device & Platform Specific Routes
Adrouter.get('/embed/:id', AdController.getAdByDevice); // ?device=web/mobile&platform=html/react/php/java/flutter/swift
Adrouter.get('/embed-code/:id', AdController.getEmbedCode); // ?language=html/javascript/react/php/java/flutter/swift/python
Adrouter.get('/public/embed-code/:id', AdController.getPublicEmbedCode); // Public access for viewers
Adrouter.post('/click/:id', AdController.trackClick); // body: {device: 'web/mobile'}

// Analytics Routes
Adrouter.get('/analytics/:id', authmiddleware, AdController.getAnalytics);
Adrouter.get('/detailed-analytics', authmiddleware, AdController.getDetailedAnalytics);

// Ad Wallet Routes
Adrouter.post('/wallet/:id/recharge', authmiddleware, AdController.rechargeAdWallet);
Adrouter.get('/wallet/:id', authmiddleware, AdController.getAdWallet);

// Impression Tracking Routes
Adrouter.post('/impression/:id', ImpressionController.trackImpression);
Adrouter.get('/impression/:id/stats', ImpressionController.getImpressionStats);
Adrouter.get('/impression/top', ImpressionController.getTopAds);
Adrouter.get('/impression/summary', ImpressionController.getImpressionSummary);

// Test route to create sample ad
Adrouter.post('/test-ad', async (req, res) => {
  try {
    const Ad = require('./AdBanner');
    const testAd = new Ad({
      title: 'Test Ad',
      width: 300,
      height: 250,
      mediaUrl: 'https://via.placeholder.com/300x250',
      mediaType: 'image',
      clickUrl: 'https://example.com',
      category: '507f1f77bcf86cd799439011', // dummy category ID
      embedCodes: {
        web: '<a href="https://example.com" target="_blank"><img src="https://via.placeholder.com/300x250" width="300" height="250" alt="Test Ad" /></a>',
        mobile: '<a href="https://example.com" target="_blank"><img src="https://via.placeholder.com/300x250" width="100%" height="auto" alt="Test Ad" style="max-width:300px;" /></a>',
        react: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">\n  <img src="https://via.placeholder.com/300x250" width={300} height={250} alt="Test Ad" style={{maxWidth: \'100%\', height: \'auto\'}} />\n</a>',
        php: '<?php echo \'<a href="https://example.com" target="_blank"><img src="https://via.placeholder.com/300x250" width="300" height="250" alt="Test Ad" /></a>\'; ?>',
        java: 'String adHtml = "<a href=\\"https://example.com\\" target=\\"_blank\\"><img src=\\"https://via.placeholder.com/300x250\\" width=\\"300\\" height=\\"250\\" alt=\\"Test Ad\\" /></a>";',
        flutter: 'GestureDetector(\n  onTap: () => launch(\'https://example.com\'),\n  child: Image.network(\'https://via.placeholder.com/300x250\', width: 300, height: 250)\n)',
        swift: 'let imageView = UIImageView()\nimageView.sd_setImage(with: URL(string: "https://via.placeholder.com/300x250"))\nlet tapGesture = UITapGestureRecognizer(target: self, action: #selector(openURL))\nimageView.addGestureRecognizer(tapGesture)'
      }
    });
    await testAd.save();
    res.json({ message: 'Test ad created', id: testAd._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route to list all ads
Adrouter.get('/debug/list', async (req, res) => {
  try {
    const Ad = require('./AdBanner');
    const ads = await Ad.find({}).select('_id title isActive embedCodes');
    res.json({ ads, count: ads.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = Adrouter;