const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  venue_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String },
  tags: { type: [String] },
  location: {
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  link: { type: String },
  priority_score: { type: Number, default: 0 }, // Default score if needed
  photos: {
    prefix: { type: String },
    suffix: { type: String },
  },
  distance: { type: Number},
  user: { type: String },
});

module.exports = mongoose.model("Recommendation", recommendationSchema);
