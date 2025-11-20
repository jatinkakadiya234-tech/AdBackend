const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'viewer', 'publisher'], default: 'viewer' },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    bannedAt: { type: Date },
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'tbl_users' },
    profile: {
        firstName: { type: String },
        lastName: { type: String },
        phone: { type: String },
        company: { type: String },
        website: { type: String },
        address: {
            street: { type: String },
            city: { type: String },
            state: { type: String },
            country: { type: String },
            zipCode: { type: String }
        }
    },
    publisherProfile: {
        businessDetails: {
            businessName: { type: String },
            businessRegistrationNumber: { type: String },
            businessCategory: { type: String },
            yearEstablished: { type: Number },
            employeeCount: { type: String }
        },
        bankingDetails: {
            accountHolderName: { type: String },
            bankName: { type: String },
            accountNumber: { type: String },
            routingNumber: { type: String }
        },
        regionalDetails: {
            primaryMarkets: [{ type: String }],
            targetAudience: { type: String },
            preferredLanguages: [{ type: String }],
            timeZone: { type: String }
        }
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
            type: { type: String, enum: ['credit', 'debit', 'refund'] },
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