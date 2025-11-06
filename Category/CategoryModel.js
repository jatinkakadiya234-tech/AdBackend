const { default: mongoose } = require("mongoose");
const { active } = require("wd/lib/commands");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    dfault: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});

const Category = mongoose.model("tbl_categorys", categorySchema);

module.exports = Category;