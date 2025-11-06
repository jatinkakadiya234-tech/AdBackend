const express = require('express');
const AdController = require('./AdController');
const authmiddleware = require('../Config/Midelwere');
const Adrouter = express.Router();

// Ad Management Routes
Adrouter.post('/create', authmiddleware, AdController.createAd);
Adrouter.get('/list', authmiddleware, AdController.getAds);
Adrouter.put('/update/:id', authmiddleware, AdController.updateAd);
Adrouter.delete('/delete/:id', authmiddleware, AdController.deleteAd);

// Device & Platform Specific Routes
Adrouter.get('/embed/:id', AdController.getAdByDevice); // ?device=web/mobile&platform=html/react/php/java/flutter/swift
Adrouter.get('/click/:id', AdController.trackClick); // ?device=web/mobile

// Analytics Route
Adrouter.get('/analytics/:id', authmiddleware, AdController.getAnalytics);

module.exports = Adrouter;