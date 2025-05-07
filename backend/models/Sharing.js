import mongoose from "mongoose";

const SharingSchema = new mongoose.Schema({
    planner_id: { type: String, ref: "User", required: true },
    venue_id: { type: String, required: true },
    shared_with: [{ type: String, ref: "User" }],
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 },
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "RSVP" }]
}, { timestamps: true });

const Sharing = mongoose.model("Sharing", SharingSchema);

export default Sharing;