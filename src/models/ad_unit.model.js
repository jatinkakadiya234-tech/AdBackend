// models/AdUnit.js
const mongoose = require('mongoose');

const adUnitSchema = new mongoose.Schema({
  // ===== Basic Information =====
  adUnitId: {
    type: String,
    unique: true,
    required: true
  }, // Auto-generated: UNIT-2024-001234
  
  name: {
    type: String,
    required: true
  },
  
  description: String,
  
  // ===== Ownership =====
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Viewer/Publisher of the platform
    required: true,
    index: true
  },
  
  platformId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ViewerProfile', // Which platform this ad unit belongs to
    required: true,
    index: true
  },
  
  // ===== Ad Unit Configuration =====
  type: {
    type: String,
    enum: ['banner', 'rewarded', 'interstitial', 'native', 'video'],
    required: true
  },
  
  // ===== Banner Specific =====
  banner: {
    sizes: [{
      width: Number,
      height: Number,
      format: {
        type: String,
        enum: ['300x250', '728x90', '160x600', '300x600', '320x50', '468x60', 'responsive']
      }
    }],
    position: {
      type: String,
      enum: ['header', 'footer', 'sidebar', 'inline', 'sticky'],
      default: 'footer'
    },
    refreshInterval: {
      type: Number,
      default: 30 // seconds
    }
  },
  
  // ===== Video/Rewarded Specific =====
  video: {
    minDuration: Number, // seconds
    maxDuration: Number,
    autoPlay: { type: Boolean, default: true },
    muted: { type: Boolean, default: true }
  },
  
  // ===== Interstitial Specific =====
  interstitial: {
    frequency: {
      type: String,
      enum: ['once_per_session', 'every_X_seconds', 'on_event'],
      default: 'once_per_session'
    },
    frequencyInterval: Number, // seconds
    events: [String] // e.g., ['level_complete', 'screen_close']
  },
  
  // ===== Native Ad Specific =====
  native: {
    adChoicesPosition: {
      type: String,
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      default: 'top-right'
    },
    requestNativeAds: { type: Number, default: 3 }
  },
  
  // ===== Targeting & Filtering =====
  targeting: {
    // Category of content this ad unit appears on
    categories: [String], // e.g., ['news', 'gaming', 'sports']
    
    // Advertiser restrictions
    allowedCategories: [String], // Which advertiser categories are allowed
    blockedCategories: [String], // Which advertiser categories are blocked
    
    // Geographic targeting
    countries: [String],
    // regions: [String],
    
    // Device/Platform targeting
    devices: {
      type: [String],
      enum: ['mobile', 'tablet', 'desktop'],
      default: ['mobile', 'tablet', 'desktop']
    },
    
    platforms: {
      type: [String],
      enum: ['web', 'ios', 'android', 'flutter', 'react_native'],
      default: ['web']
    },
    
    // Audience targeting
    ageRange: {
      min: Number,
      max: Number
    },
    
    gender: {
      type: String,
      enum: ['all', 'male', 'female', 'other']
    }
  },
  
  // ===== Ad Filtering =====
  // adFiltering: {
  //   // Block specific publishers/campaigns
  //   blockedPublishers: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }],
    
  //   blockedCampaigns: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Campaign'
  //   }],
    
  //   // Brand safety
  //   blockLanguageContent: { type: Boolean, default: false },
  //   blockSensitiveContent: { type: Boolean, default: false },
    
  //   // Block ads with certain keywords
  //   blockedKeywords: [String]
  // },
  
  // ===== Code & Integration =====
  // code: {
  //   type: String, // Integration code for this ad unit
  //   required: true,
  //   unique: true
  // },
  
    // For different platforms
    integrationCode: {
      web: String, // JavaScript snippet
      ios: String, // Swift code
      android: String, // Kotlin code
      flutter: String, // Dart code
      reactNative: String // JavaScript code
    },
  
  // ===== Performance Settings =====
  performance: {
    // Impression tracking
    // impressionTrackingUrl: String,
    
    // Click tracking
    clickTrackingUrl: String,
    
    // Viewability requirements
    viewabilityThreshold: {
      type: Number,
      default: 50 // percentage
    },
    
    // Refresh behavior
    autoRefresh: { type: Boolean, default: true },
    refreshRate: { type: Number, default: 30 } // seconds
  },
  
  // ===== Status & Moderation =====
  status: {
    type: String,
    enum: ['active', 'paused', 'pending_review', 'suspended', 'archived'],
    default: 'active'
  },
  
  // ===== Verification =====
  verification: {
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verificationCode: String, // For verifying ad unit placement
    verificationMethod: {
      type: String,
      enum: ['dns_txt', 'html_file', 'meta_tag', 'javascript_callback']
    }
  },
  
  // ===== Traffic & Size Info =====
  siteInfo: {
    siteUrl: String,
    category: String,
    monthlyTraffic: Number, // estimated monthly impressions
    uniqueMonthlyVisitors: Number
  },
  
  // ===== Statistics =====
  stats: {
    totalImpressions: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    ecpm: { type: Number, default: 0 }, // (revenue / impressions) * 1000
    ctr: { type: Number, default: 0 }
  },
  
  // ===== Integration Status =====
  integration: {
    isIntegrated: { type: Boolean, default: false },
    integratedAt: Date,
    lastActivityAt: Date,
    lastImpressionAt: Date,
    sdkVersion: String
  },
  
}, {
  timestamps: true
});

// ===== INDEXES =====
adUnitSchema.index({ adUnitId: 1 });
adUnitSchema.index({ viewerId: 1, platformId: 1 });
adUnitSchema.index({ platformId: 1 });
adUnitSchema.index({ code: 1 });
adUnitSchema.index({ status: 1 });
adUnitSchema.index({ 'verification.verified': 1 });

// ===== METHODS =====

// Generate unique code for this ad unit
adUnitSchema.methods.generateCode = function() {
  const crypto = require('crypto');
  this.code = crypto.randomBytes(16).toString('hex');
  return this.code;
};

// Get integration code for specific platform
adUnitSchema.methods.getIntegrationCode = function(platform) {
  return this.integrationCode?.[platform] || null;
};

// Record impression
adUnitSchema.methods.recordImpression = async function() {
  this.stats.totalImpressions += 1;
  this.integration.lastImpressionAt = new Date();
  this.integration.lastActivityAt = new Date();
  await this.save();
};

// Record click
adUnitSchema.methods.recordClick = async function() {
  this.stats.totalClicks += 1;
  this.integration.lastActivityAt = new Date();
  await this.save();
};

// Record revenue
adUnitSchema.methods.recordRevenue = async function(amount) {
  this.stats.totalRevenue += amount;
  
  // Calculate ECPM
  if (this.stats.totalImpressions > 0) {
    this.stats.ecpm = (this.stats.totalRevenue / this.stats.totalImpressions) * 1000;
  }
  
  // Calculate CTR
  if (this.stats.totalImpressions > 0) {
    this.stats.ctr = (this.stats.totalClicks / this.stats.totalImpressions) * 100;
  }
  
  await this.save();
};

module.exports = mongoose.model('Ad_unit', adUnitSchema);
