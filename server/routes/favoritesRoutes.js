const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");
const Recommendation = require("../models/Recommendation");
const verifyFirebaseToken = require("../middleware/firebaseAuth");

router.use(verifyFirebaseToken);

// POST /api/favorites/add
router.post("/add", async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.body;

  if (!venue_id) {
    return res.status(400).json({ error: "Missing venue_id" });
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

// GET /api/favorites/is-favorite?venue_id=123
router.get("/is-favorite", async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.query;

  if (!venue_id) {
    return res.status(400).json({ error: "Missing venue_id" });
  }

  try {
    const favorite = await Favorite.findOne({ uid, venue_id });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("❌ Error checking favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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

// POST /api/favorites/remove
router.post("/remove", async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.body;

  if (!venue_id) {
    return res.status(400).json({ error: "Missing venue_id" });
  }

  try {
    await Favorite.deleteOne({ uid, venue_id });
    res.json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.error("❌ Error removing favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
