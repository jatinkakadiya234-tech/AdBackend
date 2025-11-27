// models/PublisherAnalytics.js
const mongoose = require('mongoose');

const publisherAnalyticsSchema = new mongoose.Schema({
  // ===== Reference =====
  publisherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  
  // ===== Time Period =====
  date: { 
    type: Date, 
    required: true 
  },
  
  hourOfDay: Number,
  
  // ===== Spend Metrics =====
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    
    spend: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    cpa: { type: Number, default: 0 },
    
    // Campaign stats
    activeCampaigns: { type: Number, default: 0 },
    activeAds: { type: Number, default: 0 }
  },
  
  // ===== Top Performing Campaigns =====
  topCampaigns: [{
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    spend: Number,
    conversions: Number,
    roi: Number
  }],
  
}, {
  timestamps: true
});

publisherAnalyticsSchema.index({ publisherId: 1, date: -1 });
publisherAnalyticsSchema.index({ date: -1 });
publisherAnalyticsSchema.index(
  { publisherId: 1, date: 1, hourOfDay: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('PublisherAnalytics', publisherAnalyticsSchema);
