const { default: mongoose } = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tbl_users",
    required: true
  },
  ad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tbl_adbanners",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const Favorite = mongoose.model("tbl_favorites", favoriteSchema);

module.exports = Favorite;