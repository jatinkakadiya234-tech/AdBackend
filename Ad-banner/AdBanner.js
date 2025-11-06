
const { default: mongoose } = require("mongoose");

const AdSchema = new mongoose.Schema({
  // Core fields
  width: { 
    type: Number, 
    required: true,
    min: 1,
    max: 2000,
    validate: {
      validator: Number.isInteger,
      message: 'Width must be an integer'
    }
  },
  height: { 
    type: Number, 
    required: true,
    min: 1,
    max: 2000,
    validate: {
      validator: Number.isInteger,
      message: 'Height must be an integer'
    }
  },
  imageUrl: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Invalid image URL. Must be HTTPS and valid image format'
    }
  },
  clickUrl: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        try {
          new URL(v);
          return true;
        } catch(e) {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },

  // Metadata
  title: {
    type: String,
    default: 'Advertisement',
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  ctaText: {
    type: String,
    default: 'Learn More',
    trim: true,
    maxlength: 50
  },

  // Mobile-specific fields for SDK
  placementId: {
    type: String,
    default: null,
    index: true,
    unique: true
  },
  adType: {
    type: String,
    enum: ['banner', 'interstitial', 'rewarded'],
    default: 'banner'
  },
  adSize: {
    type: String,
    enum: ['320x50', '320x100', '320x250', '320x480', 'fullscreen'],
    default: '320x50'
  },

  // Reward fields (for rewarded ads)
  rewardAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  rewardType: {
    type: String,
    default: 'coins',
    trim: true,
    maxlength: 50
  },
  videoDuration: {
    type: Number,
    default: 0,
    min: 0,
    max: 3600 // 1 hour max
  },
  videoUrl: {
    type: String,
    default: null
  },

  // Tracking URLs (for mobile SDK events)
  impressionTrackingUrl: {
    type: String,
    default: null
  },
  clickTrackingUrl: {
    type: String,
    default: null
  },

  // Web embed codes
  embedCodeWeb: { 
    type: String,
    default: null
  },
  embedCodeMobile: { 
    type: String,
    default: null
  },

  // Status & Ownership
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "tbl_User",
    required: true,
    index: true
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  // Analytics
  impressions: { 
    type: Number, 
    default: 0,
    min: 0
  },
  clicks: { 
    type: Number, 
    default: 0,
    min: 0
  },
  rewards: {
    type: Number,
    default: 0,
    min: 0
  },
  ctr: {
    type: Number,
    default: 0,
    get: function() {
      return this.impressions > 0 ? (this.clicks / this.impressions * 100).toFixed(2) : 0;
    }
  }
}, { 
  timestamps: true,
  toJSON: { getters: true }
});

// Indexes for performance
AdSchema.index({ createdBy: 1, isActive: 1 });
AdSchema.index({ createdBy: 1, adType: 1 });
AdSchema.index({ placementId: 1 });
AdSchema.index({ createdAt: -1 });

const Ad = mongoose.model('tbl_Adbanner', AdSchema);
module.exports = Ad;



// const { default: mongoose } = require("mongoose");

// const AdSchema = new mongoose.Schema({
//     width: { type: Number, required: true },
//     height: { type: Number, required: true },
//     imageUrl: { type: String, required: true },
//     clickUrl: { type: String, required: true },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_User" },
//     isActive: { type: Boolean, default: true },
//     embedCodeWeb: { type: String },
//     embedCodeMobile: { type: String },
//     impressions: { type: Number, default: 0 },
//     clicks: { type: Number, default: 0 },
// },{ timestamps: true });
// const Ad = mongoose.model('tbl_Adbanner', AdSchema);
// module.exports = Ad;




