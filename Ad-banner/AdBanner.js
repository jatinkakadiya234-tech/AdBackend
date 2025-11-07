const { default: mongoose } = require("mongoose");

const AdSchema = new mongoose.Schema({
    title: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    clickUrl: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_categories" , required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_users" },
    isActive: { type: Boolean, default: true },
    targetDevices: [{ type: String, enum: ['web', 'mobile', 'tablet'], default: ['web', 'mobile'] }],
    targetPlatforms: [{ type: String, enum: ['html', 'react', 'php', 'java', 'flutter', 'swift'] }],
    embedCodes: {
        web: { type: String },
        mobile: { type: String },
        react: { type: String },
        php: { type: String },
        java: { type: String },
        flutter: { type: String },
        swift: { type: String }
    },
    analytics: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        webImpressions: { type: Number, default: 0 },
        mobileImpressions: { type: Number, default: 0 },
        webClicks: { type: Number, default: 0 },
        mobileClicks: { type: Number, default: 0 }
    },
    schedule: {
        startDate: { type: Date },
        endDate: { type: Date },
        isScheduled: { type: Boolean, default: false }
    }
},{ timestamps: true });
const Ad = mongoose.model('tbl_Adbanner', AdSchema);
module.exports = Ad;