const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  venueId: { type: String, required: true },
  venueData: { type: Object, required: true }, // Stores full venue data
}, { timestamps: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
