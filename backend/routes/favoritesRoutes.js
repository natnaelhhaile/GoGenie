import express from "express";
import Favorite from "../models/Favorite.js";
import Recommendation from "../models/Recommendation.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";
import { isValidVenueId } from "../utils/validators.js";

const router = express.Router();

router.use(verifyFirebaseToken);

// Add to favorites
router.post("/add", async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.body;

  if (!isValidVenueId(venue_id)) {
    return res.status(400).json({ message: "Invalid venue_id format." });
  }

  try {
    const existing = await Favorite.findOne({ uid, venue_id });
    if (existing) return res.status(200).json({ message: "Already saved" });

    const newFavorite = new Favorite({ uid, venue_id });
    await newFavorite.save();
    res.status(201).json({ message: "Favorite saved!" });
  } catch (error) {
    console.error("❌ Error saving favorite:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Check if favorite
router.get("/is-favorite", async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.query;

  if (!isValidVenueId(venue_id)) {
    return res.status(400).json({ message: "Invalid venue_id format." });
  }

  try {
    const favorite = await Favorite.findOne({ uid, venue_id });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("❌ Error checking favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// List favorites
router.get("/list", async (req, res) => {
  const uid = req.user.uid;

  try {
    const favorites = await Favorite.find({ uid });

    const enrichedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        const venueData = await Recommendation.findOne({ venue_id: fav.venue_id }).lean();
        return {
          venue_id: fav.venue_id,
          createdAt: fav.createdAt,
          updatedAt: fav.updatedAt,
          venueData: venueData || null,
        };
      })
    );

    res.status(200).json({ favorites: enrichedFavorites });
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove from favorites
router.post("/remove", async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.body;

  if (!isValidVenueId(venue_id)) {
    return res.status(400).json({ message: "Invalid venue_id format." });
  }

  try {
    await Favorite.deleteOne({ uid, venue_id });
    res.json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.error("❌ Error removing favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;