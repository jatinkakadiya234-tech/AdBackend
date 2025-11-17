const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  active: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ["banner", "video", "popup", "native", "display"],
    default: "banner"
  }
}, { timestamps: true });

const Category = mongoose.model("tbl_categorys", categorySchema);

module.exports = Category;