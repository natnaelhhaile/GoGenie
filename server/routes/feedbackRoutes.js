const express = require("express");
const Preferences = require("../models/Preferences");
const Recommendation = require("../models/Recommendation");
const UserVenueScore = require("../models/UserVenueScore");
const { calculateCosineSimilarity } = require("../utils/similarity");
const tags_vocabulary = require("../utils/tagsVocabulary");
const extractTagsFromFeatures = require("../utils/extractTagsFromFeatures");

const router = express.Router();
const MAX_DISTANCE = 10000;
const DECAY_FACTOR = 0.95;

router.post("/feedback", async (req, res) => {
  try {
    const { userId, venueId, feedback } = req.body; // feedback = "up" | "down"
    if (!userId || !venueId || !["up", "down"].includes(feedback)) {
      return res.status(400).json({ message: "Invalid request." });
    }

    const preferenceDoc = await Preferences.findOne({ user: userId });
    const venue = await Recommendation.findOne({ venue_id: venueId });
    if (!preferenceDoc || !venue) {
      return res.status(404).json({ message: "User or venue not found." });
    }

    // ✅ Extract clean tags using updated logic
    const venueTags = extractTagsFromFeatures(venue.features || {});

    // ✅ Update tag weights in Preferences
    const weights = preferenceDoc.tagWeights || {};
    tags_vocabulary.forEach(tag => {
      const currentWeight = weights[tag] || 0;
      const isRelevant = venueTags.includes(tag);

      // Apply decay
      let newWeight = currentWeight * DECAY_FACTOR;

      // Apply feedback adjustment
      if (isRelevant) {
        newWeight += feedback === "up" ? 0.2 : -0.2;
      }

      // Clamp between -1 and 1
      weights[tag] = Math.max(-1, Math.min(1, newWeight));
    });

    preferenceDoc.tagWeights = weights;
    await preferenceDoc.save();

    // ✅ Build weighted user vector
    const userVector = tags_vocabulary.map(tag => weights[tag] || 0);
    const venueVector = tags_vocabulary.map(tag => venueTags.includes(tag) ? 1 : 0);
    const similarity = calculateCosineSimilarity(userVector, venueVector);

    // ✅ Recompute priority score
    const distance = venue.distance || MAX_DISTANCE;
    const proximityScore = Math.max(0, 1 - distance / MAX_DISTANCE);

    const hasRating = typeof venue.rating === 'number';
    const hasPopularity = typeof venue.popularity === 'number';
    const normalizedRating = hasRating ? (venue.rating - 3) / 2 : 0;
    const popularityScore = hasPopularity ? venue.popularity : 0;

    let compositeRatingScore;
    if (hasRating && hasPopularity) {
      compositeRatingScore = (normalizedRating + popularityScore) / 2;
    } else if (hasRating) {
      compositeRatingScore = normalizedRating;
    } else if (hasPopularity) {
      compositeRatingScore = popularityScore;
    } else {
      compositeRatingScore = 0;
    }

    const priorityScore = (
      similarity * 0.5 +
      proximityScore * 0.3 +
      compositeRatingScore * 0.2
    ).toFixed(3);

    await UserVenueScore.findOneAndUpdate(
      { user: userId, venue_id: venueId },
      { priority_score: parseFloat(priorityScore) },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "Feedback recorded.", priorityScore });
  } catch (err) {
    console.error("Error handling feedback:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
