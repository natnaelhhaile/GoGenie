const express = require("express");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const User = require("../models/User");
const Recommendation = require("../models/Recommendation");
const UserVenueScore = require("../models/UserVenueScore");
const VenueTagVote = require("../models/VenueTagVote");
const tagsVocabulary = require("../utils/tagsVocabulary");
const { calculateCosineSimilarity } = require("../utils/similarity");

const router = express.Router();
const MAX_DISTANCE = 10000;
const DECAY_FACTOR = 0.95;

// POST /api/feedback
router.post("/", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { venue_id, feedback } = req.body;

  console.log("Feedback received:", feedback);

  if (!venue_id || !["up", "down", "none"].includes(feedback)) {
    return res.status(400).json({ message: "Invalid feedback request." });
  }

  try {
    const user = await User.findOne({ uid });
    const venue = await Recommendation.findOne({ venue_id });
    if (!user || !venue) return res.status(404).json({ message: "User or venue not found." });

    const weights = user.tagWeights || {};
    const venueTags = venue.tags || [];

    tagsVocabulary.forEach(tag => {
      const current = weights[tag] || 0;
      const relevant = venueTags.includes(tag);

      let newWeight = current * DECAY_FACTOR;
      if (relevant) {
        newWeight += feedback === "up" ? 0.2 : feedback === "down" ? -0.2 : 0;
      }
      weights[tag] = Math.max(-1, Math.min(1, newWeight));
    });

    user.tagWeights = weights;
    await user.save();

    const userVector = tagsVocabulary.map(tag => weights[tag] || 0);
    const venueVector = tagsVocabulary.map(tag => venueTags.includes(tag) ? 1 : 0);
    const similarity = calculateCosineSimilarity(userVector, venueVector);
    const proximityScore = Math.max(0, 1 - (venue.distance || MAX_DISTANCE) / MAX_DISTANCE);
    const ratingScore = typeof venue.rating === "number" ? venue.rating / 10 : 0.5;

    const priorityScore = (
      similarity * 0.6 +
      ratingScore * 0.2 +
      proximityScore * 0.2
    ).toFixed(3);

    await UserVenueScore.findOneAndUpdate(
      { uid, venue_id },
      { priorityScore: parseFloat(priorityScore), feedback },
      { upsert: true, new: true }
    );

    if (feedback === "up") {
      const topTags = Object.entries(weights)
        .filter(([tag, weight]) => weight > 0.4)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);

      const venueTagSet = new Set(venue.tags || []);
      let modified = false;

      for (const tag of topTags) {
        const voteDoc = await VenueTagVote.findOneAndUpdate(
          { venue_id, tag },
          { $addToSet: { voters: uid } },
          { upsert: true, new: true }
        );

        if (voteDoc.voters.length >= 2 && !venueTagSet.has(tag)) {
          venueTagSet.add(tag);
          modified = true;
        }
      }

      if (modified) {
        venue.tags = Array.from(venueTagSet);
        await venue.save();
      }
    }

    res.status(200).json({ message: "Feedback recorded.", priorityScore });
  } catch (err) {
    console.error("Error recording feedback:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/feedback/:venue_id
router.get("/:venue_id", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.params;

  try {
    const score = await UserVenueScore.findOne({ uid, venue_id: venue_id });
    if (!score) return res.status(200).json({ feedback: "none" });

    res.status(200).json({ feedback: score.feedback || "none" });
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;