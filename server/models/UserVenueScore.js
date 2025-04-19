const mongoose = require("mongoose");

const UserVenueScoreSchema = new mongoose.Schema({
  uid: { type: String, ref: "User", required: true },
  venue_id: { type: String, required: true },
  priorityScore: { type: Number, required: true },
});

module.exports = mongoose.model("UserVenueScore", UserVenueScoreSchema);