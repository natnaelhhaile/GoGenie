const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    ref: "User",
    unique: true
  },
  venue_id: {
    type: String,
    required: true,
    ref: "Recommendation",
    unique: true
  },
}, { timestamps: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
