const mongoose = require("mongoose");

const FavoriteSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  venue_id: { type: String, required: true }
});

// Compound unique index
FavoriteSchema.index({ uid: 1, venue_id: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", FavoriteSchema);