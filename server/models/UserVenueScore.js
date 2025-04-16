const mongoose = require("mongoose");

const UserVenueScoreSchema = new mongoose.Schema({
  user: { type: String, ref: "User", required: true },
  venue_id: { type: String, required: true },
  priority_score: { type: Number, required: true },
});

module.exports = mongoose.model("UserVenueScore", UserVenueScoreSchema);