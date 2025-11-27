// models/ViewerProfile.js
const mongoose = require('mongoose');

const viewerProfileSchema = new mongoose.Schema({
  // ===== Reference to User =====
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  
  // ===== Platform Verification Status =====
  platformStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected', 'resubmit_required'],
    default: 'not_submitted'
  },
  
  // ===== Platforms (Multiple platforms per viewer) =====
  platforms: [{
    platformId: { type: String, unique: true }, // Auto-generated
    name: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['website', 'ios_app', 'android_app', 'flutter_app', 'react_native_app'],
      required: true 
    },
    url: String, // Website URL or App Store URL
    packageName: String, // For mobile apps
    category: String,
    description: String,
    
    // Platform Verification
    verificationStatus: {
      type: String,
      enum: ['not_verified', 'pending', 'verified', 'rejected'],
      default: 'not_verified'
    },
    verificationMethod: {
      type: String,
      enum: ['dns_txt', 'html_file', 'meta_tag', 'app_store']
    },
    verificationCode: String,
    verifiedAt: Date,
    rejectionReason: String,
    
    // Platform Screenshots
    screenshots: [{
      url: String,
      description: String,
      uploadedAt: Date
    }],
    
    // Platform Stats
    stats: {
      totalImpressions: { type: Number, default: 0 },
      totalClicks: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      monthlyTraffic: Number
    },
    
    // Integration Status
    isIntegrated: { type: Boolean, default: false },
    sdkVersion: String,
    lastActivityAt: Date,
    
    // Active Ad Units
    activeAdUnits: { type: Number, default: 0 },
    
    // Status
    isActive: { type: Boolean, default: true },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // ===== Overall Statistics =====
  stats: {
    totalPlatforms: { type: Number, default: 0 },
    verifiedPlatforms: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    totalImpressions: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 }
  },
  
  // ===== Payment Settings =====
  paymentSettings: {
    minimumPayout: { type: Number, default: 100 },
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'wire_transfer']
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      swiftCode: String,
      iban: String
    },
    paypalEmail: String,
    
    // Payout Schedule
    payoutFrequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly'
    }
  },
  
  // ===== Tax Information =====
  taxInfo: {
    taxId: String,
    country: String,
    w9Submitted: { type: Boolean, default: false },
    w9FileUrl: String
  },
  
  // ===== Account Manager =====
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin user managing this viewer
  },
  
  // ===== Admin Notes =====
  adminNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
  
}, {
  timestamps: true
});

// Indexes
viewerProfileSchema.index({ userId: 1 });
viewerProfileSchema.index({ platformStatus: 1 });
viewerProfileSchema.index({ 'platforms.platformId': 1 });
viewerProfileSchema.index({ 'platforms.verificationStatus': 1 });

module.exports = mongoose.model('ViewerProfile', viewerProfileSchema);
