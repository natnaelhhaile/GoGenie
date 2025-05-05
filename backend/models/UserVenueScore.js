import mongoose from "mongoose";

const UserVenueScoreSchema = new mongoose.Schema({
  uid: { type: String, ref: "User", required: true },
  venue_id: { type: String, required: true },
  priorityScore: { type: Number, required: true },
  feedback: {
    type: String,
    enum: ["up", "down", "none"],
    default: "none"
  },
  scoreBreakdown: {
    similarity: { type: Number, default: 0 },
    proximity: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
  },  
});

const UserVenueScore = mongoose.model("UserVenueScore", UserVenueScoreSchema);

export default UserVenueScore;