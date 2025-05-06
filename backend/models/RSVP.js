import mongoose from 'mongoose';

const RSVP = new mongoose.Schema({
  uid: { type: String, ref: "User" }, // User ID (can be null for guest RSVPs)
  guestId: {type: String},
  venue_id: { type: String, required: true }, // Venue ID the RSVP is for
  response: { type: String, enum: ["yes", "no", "maybe"], default: "maybe" }, // The RSVP response
}, { timestamps: true });

// Ensuring that each user can RSVP only once per venue
RSVP.index({ uid: 1, venue_id: 1 }, { unique: true, sparse: true });
RSVP.index({ guestId: 1, venue_id: 1 }, { unique: true, sparse: true });

const RSVPModel = mongoose.model("RSVP", RSVP);

export default RSVPModel;