// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ===== Core Authentication =====
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // ===== Role Management =====
    role: {
        type: String,
        enum: ['viewer', 'publisher', 'admin'],
        default: 'viewer',
        required: true
    },

    // ===== Common Profile =====
    profile: {
        fullName: String,
        phone: String,
        avatar: String,
        timezone: { type: String, default: 'UTC' },
        language: { type: String, default: 'en' }
    },

    // ===== Account Status =====
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendReason: String,
    suspendedAt: Date,

    // ===== Security =====
    lastLogin: Date,
    lastPasswordChange: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,

    // ===== Device & Platform Info =====
    deviceInfo: {
        lastDevice: String,
        lastPlatform: String,
        lastIP: String,
        lastUserAgent: String
    },

    // ===== Preferences =====
    preferences: {
        preferredDevices: [String],
        preferredPlatforms: [String],
        notifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' }
    },

    // ===== Wallet (Common for all roles) =====
    wallet: {
        balance: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        pendingBalance: { type: Number, default: 0 }
    },

    // ===== References to Role-Specific Data =====
    publisherProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'PublisherProfile' },
    viewerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'ViewerProfile' },

    // ===== Timestamps =====
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
