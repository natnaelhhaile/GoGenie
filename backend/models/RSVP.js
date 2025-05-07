import mongoose from "mongoose";

const RSVP = new mongoose.Schema({
  sharing_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sharing",
    required: true
  },
  uid: { type: String, ref: "User" }, // Optional for guests
  guestId: { type: String },
  response: {
    type: String,
    enum: ["yes", "no", "maybe"],
    required: true
  }
}, { timestamps: true });

// Each user/guest can RSVP once per shared link
RSVP.index(
  { sharing_id: 1, uid: 1 },
  {
    unique: true,
    partialFilterExpression: { uid: { $exists: true, $ne: null } },
  }
);

RSVP.index(
  { sharing_id: 1, guestId: 1 },
  {
    unique: true,
    partialFilterExpression: { guestId: { $exists: true, $ne: null } },
  }
);

export default mongoose.model("RSVP", RSVP);