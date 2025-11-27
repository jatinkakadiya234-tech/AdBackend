// models/Ad.js
const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  // ===== Basic Info =====
  adId: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Auto-generated: AD-BANNER-001, AD-REWARDED-002, etc.
  
  name: { 
    type: String, 
    required: true 
  },
  
  // ===== Ownership =====
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
  
  // ===== Ad Type =====
  adType: {
    type: String,
    enum: ['banner', 'rewarded', 'interstitial', 'url_shortener'],
    required: true
  },
  
  // ===== Status =====
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'active', 'paused', 'rejected', 'expired'],
    default: 'draft'
  },
  
  // ===== Common Fields for All Ad Types =====
  common: {
    landingPageUrl: { 
      type: String, 
      required: true 
    },
    clickTrackingUrl: String,
    // impressionTrackingUrl: String,
    
    // Targeting
    targeting: {
      countries: [String],
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
      categories: [String],
      ageRange: {
        min: Number,
        max: Number
      },
      gender: {
        type: String,
        enum: ['all', 'male', 'female', 'other']
      }
    },
    
    // Scheduling
    schedule: {
      startDate: Date,
      endDate: Date,
      timezone: String,
      dayParting: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startHour: Number,
        endHour: Number
      }]
    }
  },
  
  // ===== BANNER AD SPECIFIC =====
  bannerAd: {
    // Only populated if adType === 'banner'
    sizes: [{
      width: { type: Number, required: function() { return this.adType === 'banner'; } },
      height: { type: Number, required: function() { return this.adType === 'banner'; } },
      imageUrl: { type: String, required: function() { return this.adType === 'banner'; } },
      fileSize: Number, // in KB
      format: {
        type: String,
        enum: ['jpg', 'png', 'gif', 'html5']
      }
    }],
    
    // Ad Copy
    headline: String,
    description: String,
    callToAction: {
      type: String,
      enum: ['Learn More', 'Shop Now', 'Sign Up', 'Download', 'Get Started', 'Buy Now', 'Subscribe']
    },
        
  },
  
  // ===== REWARDED AD SPECIFIC =====
  rewardedAd: {
    videoUrl: { type: String, required: function() { return this.adType === 'rewarded'; } },
    videoDuration: { type: Number, required: function() { return this.adType === 'rewarded'; } }, // in seconds
    videoThumbnail: String,
    videoFileSize: Number, // in MB
    videoFormat: {
      type: String,
      enum: ['mp4', 'webm', 'mov']
    },
    
    // Reward Configuration
    reward: {
      type: { 
        type: String, 
        required: function() { return this.adType === 'rewarded'; },
        enum: ['coins', 'points', 'gems', 'lives', 'premium_access', 'discount', 'custom']
      },
      value: { 
        type: Number, 
        required: function() { return this.adType === 'rewarded'; } 
      },
      description: String, // "100 Coins", "1 Extra Life", etc.
      currency: String // For games with virtual currency
    },
    
    // Completion Requirements
    completion: {
      minimumWatchTime: { type: Number, default: 30 }, // seconds
      skipAllowed: { type: Boolean, default: false },
      skipAfterSeconds: Number,
      interactionRequired: { type: Boolean, default: false },
    },
    
    // End Card 
    endCard: {
      enabled: { type: Boolean, default: true },
      imageUrl: String,
      headline: String,
      ctaText: String
    }
  },
  
  // ===== INTERSTITIAL AD SPECIFIC =====
  interstitialAd: {
    creatives: [{
      type: {
        type: String,
        enum: ['image', 'video', 'html'],
        required: function() { return this.adType === 'interstitial'; }
      },
      url: { type: String, required: function() { return this.adType === 'interstitial'; } },
      fileSize: Number,
      
      // Dimensions
      width: Number,
      height: Number,
      orientation: {
        type: String,
        enum: ['portrait', 'landscape', 'square']
      }
    }],
    
    // Display Settings
    display: {
      showCloseButton: { type: Boolean, default: true },
      closeButtonDelay: { type: Number, default: 5 }, // seconds before close button appears
      autoClose: { type: Boolean, default: false },
      autoCloseDelay: Number, // seconds
      backgroundColor: { type: String, default: '#000000' }
    },
    
    
    // // Full-screen variants for different devices
    // variants: {
    //   mobile: {
    //     portraitUrl: String,
    //     landscapeUrl: String
    //   },
    //   tablet: {
    //     portraitUrl: String,
    //     landscapeUrl: String
    //   },
    //   desktop: String
    // }
  },
  
  // ===== URL SHORTENER AD SPECIFIC =====
  urlShortenerAd: {
    // Original & Short URL
    originalUrl: { 
      type: String, 
      required: function() { return this.adType === 'url_shortener'; } 
    },
    shortUrl: { 
      type: String, 
      unique: true,
      sparse: true // Only unique if exists
    },
    customSlug: String, // User-defined short code
    
    // // Interstitial Page Before Redirect
    // interstitialPage: {
    //   enabled: { type: Boolean, default: true },
      
    //   // Creative to show
    //   adCreative: {
    //     type: {
    //       type: String,
    //       enum: ['image', 'video', 'html'],
    //       default: 'image'
    //     },
    //     url: String,
    //     headline: String,
    //     description: String
    //   },
      
    //   // Display duration
    //   displayDuration: { type: Number, default: 5 }, // seconds
      
    //   // Skip options
    //   skipAllowed: { type: Boolean, default: true },
    //   skipAfterSeconds: { type: Number, default: 3 },
      
    //   // Countdown timer
    //   showCountdown: { type: Boolean, default: true },
    //   countdownText: { type: String, default: 'Redirecting in {seconds}...' }
    // },
    
    // Redirect Settings
    redirect: {
      delay: { type: Number, default: 5 }, // seconds
      method: {
        type: String,
        enum: ['auto', 'click_required'],
        default: 'auto'
      }
    },
    
    // Link Settings
    link: {
      expiryDate: Date,
      clickCount: { type: Number, default: 0 },
      isExpired: { type: Boolean, default: false },
      password: String, // Optional password protection
    //   requiresCaptcha: { type: Boolean, default: false }
    },
  },
  
  // ===== PERFORMANCE METRICS (Common for all types) =====
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    
    // Calculated metrics
    ctr: { type: Number, default: 0 }, // Click-through rate
    conversionRate: { type: Number, default: 0 },
    
    // Revenue
    revenue: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    
    // Engagement (for rewarded/interstitial)
    // completionRate: { type: Number, default: 0 }, // For rewarded/video ads
    // averageWatchTime: Number, 
    // skipRate: { type: Number, default: 0 },
    
    // Last updated
    // lastImpressionAt: Date,
    // lastClickAt: Date
  },
  
  // ===== QUALITY & COMPLIANCE =====
//   quality: {
//     // File validation
//     filesValidated: { type: Boolean, default: false },
//     validationErrors: [String],
    
//     // Content review
//     contentReviewed: { type: Boolean, default: false },
//     reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     reviewedAt: Date,
//     reviewNotes: String,
    
//     // Compliance flags
//     flagged: { type: Boolean, default: false },
//     flagReasons: [String],
    
//     // Performance thresholds
//     performanceScore: { type: Number, default: 0 }, // 0-100
//     qualityScore: { type: Number, default: 0 } // 0-100
//   },
  
  // ===== ADMIN ACTIONS =====
  admin: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String,
    notes: String,
    
    // Moderation
    isSuspended: { type: Boolean, default: false },
    suspensionReason: String,
    suspendedAt: Date
  },
}, {
  timestamps: true
});

// ===== INDEXES =====
adSchema.index({ adId: 1 });
adSchema.index({ campaignId: 1 });
adSchema.index({ publisherId: 1 });
adSchema.index({ adType: 1 });
adSchema.index({ status: 1 });
adSchema.index({ 'urlShortenerAd.shortUrl': 1 }, { sparse: true });

// ===== VIRTUAL FIELDS =====
adSchema.virtual('campaign', {
  ref: 'Campaign',
  localField: 'campaignId',
  foreignField: '_id',
  justOne: true
});

adSchema.virtual('publisher', {
  ref: 'User',
  localField: 'publisherId',
  foreignField: '_id',
  justOne: true
});

// ===== METHODS =====

// Auto-generate adId based on type
adSchema.pre('save', async function(next) {
  if (this.isNew && !this.adId) {
    const count = await this.constructor.countDocuments({ adType: this.adType });
    const typePrefix = this.adType.toUpperCase().replace('_', '-');
    this.adId = `AD-${typePrefix}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate CTR before saving
adSchema.pre('save', function(next) {
  if (this.metrics.impressions > 0) {
    this.metrics.ctr = (this.metrics.clicks / this.metrics.impressions) * 100;
    this.metrics.conversionRate = (this.metrics.conversions / this.metrics.clicks) * 100 || 0;
  }
  next();
});

// Instance method to increment impression
adSchema.methods.recordImpression = async function() {
  this.metrics.impressions += 1;
  this.metrics.lastImpressionAt = new Date();
  await this.save();
};

// Instance method to record click
adSchema.methods.recordClick = async function() {
  this.metrics.clicks += 1;
  this.metrics.lastClickAt = new Date();
  await this.save();
};

// Instance method to record conversion
adSchema.methods.recordConversion = async function() {
  this.metrics.conversions += 1;
  await this.save();
};

// Static method to get ads by type
adSchema.statics.getByType = function(adType, options = {}) {
  return this.find({ adType, ...options });
};

module.exports = mongoose.model('Ad', adSchema);

