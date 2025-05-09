import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    venue_id: { type: String, required: true },
    uid: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Review", reviewSchema);
