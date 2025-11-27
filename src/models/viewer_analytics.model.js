// models/ViewerAnalytics.js
const mongoose = require('mongoose');

const viewerAnalyticsSchema = new mongoose.Schema({
  // ===== Reference =====
  viewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  
  // platformId: String, // Specific platform (optional)
  
  // ===== Time Period =====
  date: { 
    type: Date, 
    required: true 
  },
  
  hourOfDay: Number,
  
  // ===== Earnings Metrics =====
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    
    // Revenue
    revenue: { type: Number, default: 0 },
    ecpm: { type: Number, default: 0 }, // (revenue / impressions) * 1000
    rpm: { type: Number, default: 0 }, // Revenue per 1000 impressions
    
    // Ad type breakdown
    byAdType: [{
      adType: {
        type: String,
        enum: ['banner', 'rewarded', 'interstitial', 'url_shortener']
      },
      impressions: Number,
      clicks: Number,
      revenue: Number
    }]
  },
  
  // ===== Top Campaigns (serving on viewer's platform) =====
  topCampaigns: [{
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    impressions: Number,
    revenue: Number
  }],
}, {
  timestamps: true
});

viewerAnalyticsSchema.index({ viewerId: 1, date: -1 });
viewerAnalyticsSchema.index({ platformId: 1, date: -1 });
viewerAnalyticsSchema.index({ date: -1 });
viewerAnalyticsSchema.index(
  { viewerId: 1, platformId: 1, date: 1, hourOfDay: 1 }, 
  { unique: true, sparse: true }
);

module.exports = mongoose.model('ViewerAnalytics', viewerAnalyticsSchema);
