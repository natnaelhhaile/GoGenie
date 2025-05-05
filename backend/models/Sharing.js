import mongoose from "mongoose";

const SharingSchema = new mongoose.Schema({
  planner_id: { type: String, ref: "User", required: true },  // The planner who shares the venue
  venue_id: { type: String, required: true },                 // The venue being shared
  shared_with: [{ type: String, ref: "User" }],                // The users this venue was shared with
  share_link: { type: String, required: true },                // A unique share link for tracking
  rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "RSVP" }] // Track RSVPs for shared users
}, { timestamps: true });

const Sharing = mongoose.model("Sharing", SharingSchema);

export default Sharing;