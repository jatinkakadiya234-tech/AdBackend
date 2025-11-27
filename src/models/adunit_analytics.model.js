// models/AdUnitAnalytics.js
const mongoose = require('mongoose');

const adUnitAnalyticsSchema = new mongoose.Schema({
  // ===== Reference =====
  adUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdUnit',
    required: true,
    index: true
  },
  
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  platformId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ViewerProfile',
    required: true
  },
  
  // ===== Time Period (Daily) =====
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // ===== Metrics =====
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    
    // Revenue metrics
    revenue: { type: Number, default: 0 }, // What viewer earns
    ctr: { type: Number, default: 0 },
    ecpm: { type: Number, default: 0 },
    rpm: { type: Number, default: 0 },
    
    // Ad type breakdown
    byAdType: [{
      adType: {
        type: String,
        enum: ['banner', 'rewarded', 'interstitial', 'native', 'video']
      },
      impressions: Number,
      clicks: Number,
      revenue: Number
    }]
  },
  
  // ===== Top Campaigns on this Ad Unit =====
  topCampaigns: [{
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    publisherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    impressions: Number,
    revenue: Number
  }],
  
  // ===== Device Breakdown =====
  byDevice: [{
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop']
    },
    impressions: Number,
    clicks: Number,
    revenue: Number
  }],
  
  // ===== Geographic Breakdown =====
  byCountry: [{
    country: String,
    impressions: Number,
    clicks: Number,
    revenue: Number
  }],
}, {
  timestamps: true
});

// ===== COMPOUND UNIQUE INDEX =====
adUnitAnalyticsSchema.index(
  { adUnitId: 1, date: 1 },
  { unique: true }
);

adUnitAnalyticsSchema.index({ viewerId: 1, date: -1 });
adUnitAnalyticsSchema.index({ platformId: 1, date: -1 });

module.exports = mongoose.model('AdUnitAnalytics', adUnitAnalyticsSchema);
