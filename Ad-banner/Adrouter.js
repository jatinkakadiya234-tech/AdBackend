const express = require('express');
const AdController = require('./AdController');
const authmiddleware = require('../Config/Midelwere');
const upload = require('../Config/multer');
const Adrouter = express.Router();

// Ad Management Routes
Adrouter.post('/create', authmiddleware, upload.single('file'), AdController.createAd);
Adrouter.get('/ads', authmiddleware, AdController.getAds);
Adrouter.get('/all', AdController.getAllAds);
Adrouter.put('/update/:id', authmiddleware, upload.single('file'), AdController.updateAd);
Adrouter.delete('/delete/:id', authmiddleware, AdController.deleteAd);

// Device & Platform Specific Routes
Adrouter.get('/embed/:id', AdController.getAdByDevice); // ?device=web/mobile&platform=html/react/php/java/flutter/swift
Adrouter.post('/click/:id', AdController.trackClick); // body: {device: 'web/mobile'}

// Analytics Route
Adrouter.get('/analytics/:id', authmiddleware, AdController.getAnalytics);

module.exports = Adrouter;