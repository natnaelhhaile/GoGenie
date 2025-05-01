import mongoose from "mongoose";

const VenueTagVoteSchema = new mongoose.Schema({
  venue_id: { type: String, required: true },
  tag: { type: String, required: true },
  voters: [String] // store user UIDs
}, { timestamps: true });

VenueTagVoteSchema.index({ venue_id: 1, tag: 1 }, { unique: true });

const VenueTagVote = mongoose.model("VenueTagVote", VenueTagVoteSchema);

export default VenueTagVote;