import mongoose from "mongoose";

const FavoriteSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  venue_id: { type: String, required: true }
});

// Compound unique index
FavoriteSchema.index({ uid: 1, venue_id: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", FavoriteSchema);

export default Favorite;