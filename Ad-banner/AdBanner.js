const { default: mongoose } = require("mongoose");

const AdSchema = new mongoose.Schema({
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    clickUrl: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_User" },
    isActive: { type: Boolean, default: true },
    embedCodeWeb: { type: String },
    embedCodeMobile: { type: String },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
},{ timestamps: true });
const Ad = mongoose.model('tbl_Ad', AdSchema);
module.exports = Ad;