// models/Campaign.js
const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    // ===== Owner =====
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ===== Basic Info =====
    campaignId: { type: String, unique: true, required: true }, // Auto-generated
    campaignName: { type: String, required: true },
    objective: String,

    // ===== Campaign Duration =====
    campaignDuration: {
      type: String,
      enum: ["continuous", "scheduled"],
      required: true,
      default: "continuous",
    },
    schedule: {
      startDate: {
        type: Date,
        required: function () {
          return this.campaignDuration === "scheduled";
        },
      },
      endDate: {
        type: Date,
        required: function () {
          return this.campaignDuration === "scheduled";
        },
        validate: {
          validator: function (value) {
            if (
              this.campaignDuration === "scheduled" &&
              this.schedule?.startDate
            ) {
              return value > this.schedule.startDate;
            }
            return true;
          },
          message: "End date must be after start date",
        },
      },
      timezone: { type: String, default: "UTC" },
    },

    // ===== Ad Type =====
    adType: {
      type: String,
      enum: ["banner", "rewarded", "interstitial", "url_shortener"],
      required: true,
    },

    // ===== Status =====
    status: {
      type: String,
      enum: ["draft", "pending_review", "active", "paused", "completed", "rejected"],
      default: "draft",
    },
    reviewStatus: {
      type: String,
      enum: ["not_submitted", "pending_review", "approved", "rejected", "changes_requested"],
      default: "not_submitted",
    },

    // ===== Budget =====
    budget: {
      total: { type: Number, required: true },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },

    // ===== Daily Budget (with no-limit option) =====
    dailyBudget: {
      amount: {
        type: Number,
        min: 0,
        validate: {
          validator: function (value) {
            if (!this.dailyBudget?.noLimit && (value === undefined || value === null)) {
              return false;
            }
            return true;
          },
          message: "Daily budget is required unless 'no limit' is selected",
        },
      },
      noLimit: { type: Boolean, default: false },
    },

    // ===== Creative Section (Step 2) =====
    creative: {
      banner: [
        {
          size: {
            type: String,
            enum: [
              "300x250",
              "336x280",
              "728x90",
              "300x600",
              "320x50",
              "320x100",
            ],
          },
          imageUrl: String,
          altText: String,
          clickUrl: String,
          openNewTab: Boolean,
          utmSource: String,
          utmMedium: String,
          utmCampaign: String,
          utmContent: String,
        },
      ],

      rewarded: {
        videoUrl: String,
        thumbnailUrl: String,
        staticImageUrl: String,
        rewardType: String,
        rewardName: String,
        headline: String,
        description: String,
        cta: String,
        clickUrl: String,
      },

      interstitial: {
        imageUrl: String,
        videoUrl: String,
        displayDuration: Number,
        headline: String,
        description: String,
        cta: String,
        clickUrl: String,
      },

      urlShortener: {
        originalUrl: String,
        shortUrl: String,
        redirectDelay: Number,
      },

      creativeNotes: String,
    },

    // ===== Targeting (Step 3) =====
    targeting: {
      geoTargeting: {
        type: String,
        enum: ["all", "specific"],
        default: "all",
      },
      selectedCountries: [String],

      // 👥 Demographics
      ageGroups: [String],
      gender: {
        type: String,
        enum: ["all", "male", "female", "other"],
        default: "all",
      },

      // ❤️ Interests
      interests: [String],

      // 📅 Schedule Targeting
      selectedDays: [String],
      allDay: { type: Boolean, default: true },
      timeFrom: String, // HH:mm
      timeTo: String, // HH:mm
      timezone: { type: String, default: "UTC" },

      // 📰 Content/Contextual
      contentCategories: [String],
      keywords: [String],
    },

    // ===== Performance Stats =====
    stats: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      cpc: { type: Number, default: 0 },
      cpm: { type: Number, default: 0 },
    },

    // ===== Admin Review =====
    adminReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
      rejectionReason: String,
      adminNotes: String,
    },
  },
  { timestamps: true }
);

// Indexes
campaignSchema.index({ publisherId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ reviewStatus: 1 });

module.exports = mongoose.model("Campaign", campaignSchema);
