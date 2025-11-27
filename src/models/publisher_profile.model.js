// models/PublisherProfile.js
const mongoose = require('mongoose');

const publisherProfileSchema = new mongoose.Schema({
    // ===== Reference to User =====
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // ===== KYC Status =====
    kycStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'resubmit_required'],
        default: 'not_submitted'
    },
    kycSubmittedAt: Date,
    kycApprovedAt: Date,
    kycRejectedAt: Date,
    kycRejectionReason: String,

    // ===== KYC Documents =====
    kycDocuments: {

        bankStatement: {
            fileUrl: String,
            fileName: String,
            uploadedAt: Date,
            verified: { type: Boolean, default: false }
        },

        websiteScreenShot: {
            fileUrl: String,
            fileName: String,
            uploadedAt: Date,
            verified: { type: Boolean, default: false }
        },

        companyRegistrationDoc: {
            fileUrl: String,
            fileName: String,
            uploadedAt: Date,
            verified: { type: Boolean, default: false }
        },

        // businessRegistration: {
        //     fileUrl: String,
        //     fileName: String,
        //     uploadedAt: Date,
        //     verified: { type: Boolean, default: false }
        // },
        // taxDocument: {
        //     fileUrl: String,
        //     fileName: String,
        //     uploadedAt: Date,
        //     verified: { type: Boolean, default: false }
        // },
        // identityProof: {
        //     fileUrl: String,
        //     fileName: String,
        //     uploadedAt: Date,
        //     verified: { type: Boolean, default: false }
        // },
        // addressProof: {
        //     fileUrl: String,
        //     fileName: String,
        //     uploadedAt: Date,
        //     verified: { type: Boolean, default: false }
        // }
    },

    // ===== Company Information =====
    company: {
        legalName: { type: String, required: true },
        registrationNumber: String,
        taxId: String,
        incorporationDate: Date,
        industry: String,
        description: String,
        address: {
            fullAddress: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
        },
        AuthorizedPersonName: String,
        // contact: {
        //     email: String,
        //     phone: String,
        //     fax: String
        // }
        AuthorizedPersonDesignation: String
    },

    PlatformDetails: {
        website: String,
        websiteCategory: String,
        websiteLanguage: String,
        websiteDescription: String,
        monthlyVisitors: Number,
        primaryAudienceLocation: String,

        AdditionalPlatforms: {
            platformName: String,
            platformUrl: String,
            // platformDescription: String,
            // platformCategory: String,
            // platformLanguage: String,
            // platformMonthlyVisitors: Number,
            // platformPrimaryAudienceLocation: String
        },
        SocialMedia: {
            Facebook: String,
            Instagram: String,
            Twitter: String,
            YouTube: string
        },

        // Legal and Ownership Confirmations
        confirmations: {
            ownsWebsite: {
                type: Boolean,
                default: false,
                required: true,
                description: "User confirms they own and control the website content"
            },
            hasMonetizationRights: {
                type: Boolean,
                default: false,
                required: true,
                description: "User confirms they have rights to monetize the platform"
            },
            noCopyrightViolation: {
                type: Boolean,
                default: false,
                required: true,
                description: "User confirms their content does not violate copyright laws"
            }
        }
    },

    // ===== Payment Settings =====
    paymentSettings: {
        // billingAddress: {
        //     street: String,
        //     city: String,
        //     state: String,
        //     country: String,
        //     zipCode: String
        // },
        // paymentMethods: [{
        //     type: { type: String, enum: ['credit_card', 'bank_transfer', 'paypal'] },
        //     isDefault: Boolean,
        //     details: mongoose.Schema.Types.Mixed
        // }],


        bankName: String,
        accountNumber: String,
        accountHolderName: String,
        swiftCode: String,
        iban: String,
        ifscCode: String,
        bankAddress: String,

        paymentPreference: {
            minimumPayoutThreshold: Number,
            paymentFrequency: String
        }
    },

    AdPreferences: {
        AdTypes: [{
            type: String,
            enum: ['banner', 'rewarded', 'interstitial', 'url_shortener'],
            required: true
        }],

        bannerConfig: {
            bannerSizes: [{
                type: String,
                enum: [
                    '300x250', // Medium Rectangle
                    '336x280', // Large Rectangle
                    '728x90',  // Leaderboard
                    '300x600', // Half Page
                    '320x50',  // Mobile Banner
                    '320x100'  // Large Mobile Banner
                ]
            }]
        },

        urlShortenerConfig: {
            estimatedDailyLinks: {
                type: String, // or Number if you want specific numeric input
                enum: ['<100', '100-500', '500-1000', '1000+'],
                description: "Estimated number of short links user expects to create daily"
            },
            primaryUseCase: {
                type: String,
                enum: [
                    'marketing_campaigns',
                    'affiliate_tracking',
                    'social_media_sharing',
                    'custom_brand_links',
                    'other'
                ],
                description: "User’s primary reason for using the shortener"
            }
        },

        targetAudience: {
            ageRange: String,
            interests: [String]
        },

        budget: {
            min: Number,
            max: Number
        },

        contentPreferences: {
            categories: [String],
            keywords: [String],
            language: String
        },

        preferredPlatforms: [String]
    },



    // ===== Notes (Admin only) =====
    adminNotes: [{
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
}, {
    timestamps: true
});

// Indexes
publisherProfileSchema.index({ userId: 1 });
publisherProfileSchema.index({ kycStatus: 1 });
publisherProfileSchema.index({ 'company.name': 1 });

module.exports = mongoose.model('PublisherProfile', publisherProfileSchema);
