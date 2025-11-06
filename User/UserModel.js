const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'advertiser', 'viewer'], default: 'viewer' },
    isActive: { type: Boolean, default: true },
    walletBalance: { type: Number, default: 0 }
},{ timestamps: true });

const User = mongoose.model('tbl_users', UserSchema);
module.exports = User;