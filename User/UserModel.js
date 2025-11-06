const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'advertiser', 'viewer'], default: 'viewer' },
    isActive: { type: Boolean, default: true },
    profile: {
        firstName: { type: String },
        lastName: { type: String },
        phone: { type: String },
        company: { type: String },
        website: { type: String }
    },
    preferences: {
        preferredDevices: [{ type: String, enum: ['web', 'mobile', 'tablet'], default: ['web'] }],
        preferredPlatforms: [{ type: String, enum: ['html', 'react', 'php', 'java', 'flutter', 'swift'], default: ['html'] }],
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' }
    },
    wallet: {
        balance: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        transactions: [{
            type: { type: String, enum: ['credit', 'debit'] },
            amount: { type: Number },
            description: { type: String },
            date: { type: Date, default: Date.now }
        }]
    },
    subscription: {
        plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true }
    },
    lastLogin: { type: Date },
    deviceInfo: {
        lastDevice: { type: String },
        lastPlatform: { type: String },
        lastIP: { type: String }
    }
},{ timestamps: true });

const User = mongoose.model('tbl_users', UserSchema);
module.exports = User;