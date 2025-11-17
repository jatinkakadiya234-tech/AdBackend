const mongoose = require("mongoose");

const AdSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    mediaUrl: { type: String, required: true },
    mediaType: {
      type: String,
      enum: ["image", "video", " "],
      required: true,
    },
    clickUrl: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_categorys", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_users" },
    isActive: { type: Boolean, default: true },
    credit: { type: Number, default: 0, required: true },
    targetDevices: [
      {
        type: String,
        enum: ["web", "mobile", "tablet"],
        default: ["web", "mobile"],
      },
    ],
    targetPlatforms: [
      {
        type: String,
        enum: ["html", "react", "php", "java", "flutter", "swift"],
      },
    ],
    embedCodes: {
      web: { type: String },
      mobile: { type: String },
      react: { type: String },
      php: { type: String },
      java: { type: String },
      flutter: { type: String },
      swift: { type: String },
    },
    analytics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      webImpressions: { type: Number, default: 0 },
      mobileImpressions: { type: Number, default: 0 },
      webClicks: { type: Number, default: 0 },
      mobileClicks: { type: Number, default: 0 },
    },
    schedule: {
      startDate: { type: Date },
      endDate: { type: Date },
      isScheduled: { type: Boolean, default: false },
    },
    wallet: {
      creationCost: { type: Number, default: 0.50 },
      totalSpent: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      recharges: [{
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: { type: String, default: 'manual' },
        description: { type: String, default: 'Ad wallet recharge' }
      }],
      lastPayment: { type: Date, default: Date.now }
    },
  },
  { timestamps: true }
);
const Ad = mongoose.model("tbl_Adbanner", AdSchema);
module.exports = Ad;
