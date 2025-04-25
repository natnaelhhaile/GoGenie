const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  venue_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },

  location: {
    address: { type: String },
    formattedAddress: { type: String },
    locality: { type: String },
    region: { type: String },
    country: { type: String },
    postcode: { type: String }
  },

  categories: {
    type: [String],
    default: []
  },

  tags: {
    type: [String],
    default: []
  },

  rating: { type: Number },
  link: { type: String },

  photos: {
    type: [String],
    default: []
  },

  distance: { type: Number },

  // Allows multiple users to be linked to the same recommendation
  users: [{ type: String, ref: "User" }]

}, { timestamps: true });


module.exports = mongoose.model("Recommendation", recommendationSchema);