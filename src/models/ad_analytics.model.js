// models/AdAnalytics.js
const mongoose = require('mongoose');

const adAnalyticsSchema = new mongoose.Schema({
  // ===== Reference =====
  adId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ad',
    required: true
  },
  
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
  
  hourOfDay: Number,
  
  // ===== Metrics (same structure as CampaignAnalytics) =====
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    
    // Revenue
    spend: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    cpa: { type: Number, default: 0 }
  },
  
  // ===== Platform/Device/Country Breakdowns =====
  byPlatform: [{ platform: String, impressions: Number, clicks: Number }],
  byDevice: [{ deviceType: String, impressions: Number, clicks: Number }],
  byCountry: [{ country: String, impressions: Number, clicks: Number }],
}, {
  timestamps: true
});

adAnalyticsSchema.index({ adId: 1, date: -1 });
adAnalyticsSchema.index({ campaignId: 1, date: -1 });
adAnalyticsSchema.index({ date: -1 });
adAnalyticsSchema.index({ adId: 1, date: 1, hourOfDay: 1 }, { unique: true });

module.exports = mongoose.model('AdAnalytics', adAnalyticsSchema);
