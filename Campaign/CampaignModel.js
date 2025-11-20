const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_categories" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_users", required: true },
    
    // Campaign Status
    status: { 
        type: String, 
        enum: ['draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'completed'], 
        default: 'draft' 
    },
    
    // Campaign Details
    campaignDetails: {
        objective: { 
            type: String, 
            enum: ['brand_awareness', 'traffic', 'conversions', 'app_installs', 'lead_generation'],
            required: true 
        },
        budget: {
            type: { type: String, enum: ['daily', 'lifetime'], required: true },
            amount: { type: Number, required: true },
            currency: { type: String, default: 'USD' }
        },
        schedule: {
            startDate: { type: Date, default: Date.now },
            endDate: { type: Date },
            isScheduled: { type: Boolean, default: true },
            timeZone: { type: String, default: 'UTC' }
        },
        bidding: {
            strategy: { 
                type: String, 
                enum: ['cpc', 'cpm', 'cpa', 'automatic'], 
                default: 'cpc' 
            },
            amount: { type: Number, required: true }
        }
    },

    // Targeting
    targeting: {
        demographics: {
            ageRange: {
                min: { type: Number, min: 13, max: 65 },
                max: { type: Number, min: 18, max: 65 }
            },
            gender: { type: String, enum: ['all', 'male', 'female'], default: 'all' },
            languages: [{ type: String }]
        },
        geographic: {
            countries: [{ type: String }],
            regions: [{ type: String }],
            cities: [{ type: String }],
            radius: { type: Number },
            locationType: { 
                type: String, 
                enum: ['people_in_location', 'people_recently_in_location', 'people_traveling_to_location'],
                default: 'people_in_location'
            }
        },
        interests: [{ type: String }],
        behaviors: [{ type: String }],
        devices: [{ 
            type: String, 
            enum: ['desktop', 'mobile', 'tablet'],
            default: ['desktop', 'mobile'] 
        }],
        platforms: [{ 
            type: String, 
            enum: ['web', 'mobile_app', 'social_media'],
            default: ['web'] 
        }]
    },

    // Ad Creative
    adCreatives: [{
        type: { type: String, enum: ['image', 'video', 'banner', 'popup', 'native', 'interstitial', 'rewarded'], required: true },
        title: { type: String, required: true },
        description: { type: String },
        mediaUrl: { type: String },
        clickUrl: { type: String, required: true },
        callToAction: { 
            type: String, 
            enum: ['learn_more', 'shop_now', 'sign_up', 'download', 'contact_us', 'get_quote'],
            default: 'learn_more'
        },
        dimensions: {
            width: { type: Number },
            height: { type: Number }
        }
    }],

    // Performance Metrics
    performance: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        spend: { type: Number, default: 0 },
        ctr: { type: Number, default: 0 },
        cpc: { type: Number, default: 0 },
        cpm: { type: Number, default: 0 },
        roas: { type: Number, default: 0 }
    },

    // Review Process
    reviewProcess: {
        submittedAt: { type: Date },
        reviewedAt: { type: Date },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_users" },
        reviewNotes: { type: String },
        rejectionReason: { type: String },
        reviewHistory: [{
            action: { type: String, enum: ['submitted', 'approved', 'rejected', 'revision_requested'] },
            date: { type: Date, default: Date.now },
            reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_users" },
            notes: { type: String }
        }]
    },

    // Compliance & Policies
    compliance: {
        policyCompliant: { type: Boolean, default: false },
        contentRating: { type: String, enum: ['G', 'PG', 'PG-13', 'R'], default: 'G' },
        industryCategory: { type: String },
        disclaimers: [{ type: String }]
    }
}, { timestamps: true });

CampaignSchema.index({ createdBy: 1, status: 1 });
CampaignSchema.index({ status: 1, createdAt: -1 });

const Campaign = mongoose.model('tbl_campaigns', CampaignSchema);
module.exports = Campaign;