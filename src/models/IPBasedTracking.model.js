// models/IPTracking.js
const mongoose = require('mongoose');

const ipTrackingSchema = new mongoose.Schema({
  // ===== IP Information =====
  ipAddress: { 
    type: String, 
    required: true,
    index: true
  },
  
  ipHash: { 
    type: String, 
    required: true,
    index: true 
  }, // SHA256 hash for privacy
  
  // ===== Geographic Data =====
  location: {
    country: String,
    countryCode: String,
    region: String,
    // city: String,
    timezone: String,
  },
  
  // ===== Click Tracking by Ad =====
  adClicks: [{
    adId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ad',
      required: true 
    },
    adUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ad_unit"
    },
    campaignId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Campaign' 
    },
    publisherId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    viewerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    // platformId: String,
    
    // Click Details
    clicks: [{
      timestamp: { type: Date, default: Date.now },
      userAgent: String,
      deviceType: String,
      platform: String, // 'web', 'ios', 'android', 'flutter', 'react_native'
      sdk: String, // 'javascript', 'swift', 'kotlin', 'flutter', 'react-native'
      sdkVersion: String,
    //   fingerprint: String // Device fingerprint
    }],
    
    // Daily click count (for quick lookup)
    dailyClicks: [{
      date: { type: Date, required: true },
      count: { type: Number, default: 0 }
    }],
    
    totalClicks: { type: Number, default: 0 },
    lastClickAt: Date,
    firstClickAt: Date
  }],
}, {
  timestamps: true
});

// ===== INDEXES =====
ipTrackingSchema.index({ ipHash: 1 });
ipTrackingSchema.index({ ipAddress: 1 });
ipTrackingSchema.index({ 'adClicks.adId': 1 });
ipTrackingSchema.index({ fraudScore: -1 });
ipTrackingSchema.index({ isBlocked: 1 });
ipTrackingSchema.index({ 'adClicks.dailyClicks.date': -1 });

// ===== METHODS =====

// Check if IP can click on ad
ipTrackingSchema.methods.canClick = function(adId) {
  const today = new Date().setHours(0, 0, 0, 0);
  const adClick = this.adClicks.find(ac => ac.adId.toString() === adId.toString());
  
  if (!adClick) return true;
  
  // Find today's clicks
  const todayClicks = adClick.dailyClicks.find(dc => 
    new Date(dc.date).setHours(0, 0, 0, 0) === today
  );
  
  // Check if exceeded limit (10 clicks per day)
  if (todayClicks && todayClicks.count >= 10) {
    return false;
  }
  
  return true;
};

// Record a click
ipTrackingSchema.methods.recordClick = async function(clickData) {
  const { 
    adId, 
    campaignId, 
    publisherId, 
    viewerId, 
    platformId,
    deviceType, 
    platform, 
    sdk,
    sdkVersion,
    // sessionId,
    // fingerprint 
  } = clickData;
  
  const today = new Date().setHours(0, 0, 0, 0);
  
  // Find or create adClicks entry
  let adClick = this.adClicks.find(ac => ac.adId.toString() === adId.toString());
  
  if (!adClick) {
    adClick = {
      adId,
      campaignId,
      publisherId,
      viewerId,
      platformId,
      clicks: [],
      dailyClicks: [],
      totalClicks: 0
    };
    this.adClicks.push(adClick);
  }
  
  // Add click
  adClick.clicks.push({
    timestamp: new Date(),
    deviceType,
    platform,
    sdk,
    sdkVersion,
    // sessionId,
    // fingerprint
  });
  
  // Update daily clicks
  let dailyClick = adClick.dailyClicks.find(dc => 
    new Date(dc.date).setHours(0, 0, 0, 0) === today
  );
  
  if (dailyClick) {
    dailyClick.count += 1;
  } else {
    adClick.dailyClicks.push({
      date: new Date(today),
      count: 1
    });
  }
  
  // Update totals
  adClick.totalClicks += 1;
  adClick.lastClickAt = new Date();
  if (!adClick.firstClickAt) {
    adClick.firstClickAt = new Date();
  }
  
  await this.save();
};


module.exports = mongoose.model('IPTracking', ipTrackingSchema);
