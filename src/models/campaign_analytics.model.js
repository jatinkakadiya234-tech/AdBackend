// models/CampaignAnalytics.js
const mongoose = require('mongoose');

const campaignAnalyticsSchema = new mongoose.Schema({
  // ===== Reference =====
  campaignId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Campaign',
    required: true
  },
  
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
  
  hourOfDay: Number, // 0-23 for hourly granularity
  
  // ===== Metrics =====
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    
    // Calculated
    ctr: { type: Number, default: 0 }, // (clicks / impressions) * 100
    conversionRate: { type: Number, default: 0 }, // (conversions / clicks) * 100
    
    // Revenue
    spend: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 }, // spend / clicks
    cpm: { type: Number, default: 0 }, // (spend / impressions) * 1000
    cpa: { type: Number, default: 0 }, // spend / conversions
    
    // Video-specific (for rewarded/interstitial)
    // videoStarts: { type: Number, default: 0 },
    // videoCompletes: { type: Number, default: 0 },
    // completionRate: { type: Number, default: 0 },
    // averageWatchTime: { type: Number, default: 0 },
    
    // Engagement
    uniqueIPs: { type: Number, default: 0 }
  },
  
  // ===== Breakdown by Platform =====
  byPlatform: [{
    platform: {
      type: String,
      enum: ['web', 'ios', 'android', 'flutter', 'react_native']
    },
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spend: Number
  }],
  
  // ===== Breakdown by Device =====
  byDevice: [{
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop']
    },
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spend: Number
  }],
  
  // ===== Breakdown by Country =====
  byCountry: [{
    country: String,
    countryCode: String,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spend: Number
  }],
  
}, {
  timestamps: true
});

// ===== INDEXES =====
campaignAnalyticsSchema.index({ campaignId: 1, date: -1 });
campaignAnalyticsSchema.index({ publisherId: 1, date: -1 });
campaignAnalyticsSchema.index({ date: -1 });

// ===== COMPOUND UNIQUE INDEX =====
campaignAnalyticsSchema.index(
  { campaignId: 1, date: 1, hourOfDay: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('CampaignAnalytics', campaignAnalyticsSchema);
