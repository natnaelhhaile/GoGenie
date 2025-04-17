const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");

// POST: Save favorite
router.post("/add", async (req, res) => {
  const { userId, venueId, venueData } = req.body;

  if (!userId || !venueId || !venueData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await Favorite.findOne({ userId, venueId });
    if (existing) return res.status(200).json({ message: "Already saved" });

    const newFavorite = new Favorite({ userId, venueId, venueData });
    await newFavorite.save();
    res.status(201).json({ message: "Favorite saved!" });
  } catch (error) {
    console.error("❌ Error saving favorite:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET: Fetch favorites
router.get('/is-favorite', async (req, res) => {
  const { userId, venueId } = req.query;

  if (!userId || !venueId) {
    return res.status(400).json({ message: 'Missing userId or venueId' });
  }

  try {
    const favorite = await Favorite.findOne({ userId, venueId }); // ✅ must match both
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('❌ Error checking favorite status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Check if venue is favorited by user
router.get("/is-favorite", async (req, res) => {
  const { userId, venueId } = req.query;

  if (!userId || !venueId) {
    return res.status(400).json({ error: "Missing userId or venueId" });
  }

  try {
    const existing = await Favorite.find({ userId });
    console.log(existing);
    res.json({ isFavorite: !!existing });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/favorites/list/:userId
router.get("/list/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const favorites = await Favorite.find({ userId });
    res.status(200).json({ favorites });
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    res.status(500).json({ message: "Server error while fetching favorites" });
  }
});

// Unfavorite a venue
router.post("/remove", async (req, res) => {
  const { userId, venueId } = req.body;

  if (!userId || !venueId) {
    return res.status(400).json({ message: "userId and venueId are required" });
  }

  try {
    await Favorite.deleteOne({ userId, venueId });
    res.json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.error("❌ Error removing favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
