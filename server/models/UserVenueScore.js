const mongoose = require("mongoose");

const UserVenueScoreSchema = new mongoose.Schema({
  uid: { type: String, ref: "User", required: true },
  venue_id: { type: String, required: true },
  priorityScore: { type: Number, required: true },
  feedback: {
    type: String,
    enum: ["up", "down", "none"],
    default: "none"
  }
});

module.exports = mongoose.model("UserVenueScore", UserVenueScoreSchema);