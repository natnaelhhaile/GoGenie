import express from "express";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";
import User from "../models/User.js";
import Recommendation from "../models/Recommendation.js";
import UserVenueScore from "../models/UserVenueScore.js";
import VenueTagVote from "../models/VenueTagVote.js";
import { getCachedVocabulary } from "../utils/vocabularyCache.js";
import { calculateCosineSimilarity } from "../utils/similarity.js";
import { isValidVenueId, isValidFeedbackType } from "../utils/validators.js";

const router = express.Router();
const MAX_DISTANCE = 10000;
const DECAY_FACTOR = 0.95;

// POST route to update feedback for a venue
router.post("/", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { venue_id, feedback } = req.body;

  if (!isValidVenueId(venue_id) || !isValidFeedbackType(feedback)) {
    return res.status(400).json({ message: "Invalid feedback request." });
  }

  try {
    const user = await User.findOne({ uid });
    const venue = await Recommendation.findOne({ venue_id });
    if (!user || !venue) return res.status(404).json({ message: "User or venue not found." });

    const weights = user.tagWeights || {};
    const feedbackCounts = user.tagFeedbackCount || {};
    const venueTags = venue.tags || [];
    const vocab = await getCachedVocabulary();

    vocab.forEach((tag) => {
      const currentWeight = weights[tag] || 0;
      const isRelevant = venueTags.includes(tag);
      const count = feedbackCounts[tag] || 1;

      // Adjust the weight dynamically based on feedback frequency
      let adjustment = 0;
      if (isRelevant) {
        adjustment = feedback === "up" ? (0.2 / Math.sqrt(count)) : feedback === "down" ? (-0.2 / Math.sqrt(count)) : 0;
      }

      // Decayed + weighted update
      const newWeight = Math.max(-1, Math.min(1, (currentWeight * DECAY_FACTOR) + adjustment));

      weights[tag] = newWeight;
      feedbackCounts[tag] = count + (isRelevant ? 1 : 0); // count if tag is relevant
    });

    user.tagWeights = weights;
    user.tagFeedbackCount = feedbackCounts;
    await user.save();

    const userVector = vocab.map(tag => weights[tag] || 0);
    const venueVector = vocab.map(tag =>
      venueTags.includes(tag.toLowerCase()) ? 1 : 0
    );
    
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
      { 
        priorityScore: parseFloat(priorityScore), 
        feedback,
        scoreBreakdown: {
          similarity: parseFloat(similarity.toFixed(3)),
          proximity: parseFloat(proximityScore.toFixed(3)),
          rating: parseFloat(ratingScore.toFixed(3))
        }
      },
      { upsert: true, new: true }
    );

    // Handle venue tag votes when feedback is "up"
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

// GET route to fetch existing feedback
router.get("/:venue_id", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { venue_id } = req.params;

  if (!isValidVenueId(venue_id)) {
    return res.status(400).json({ message: "Invalid venue_id format." });
  }

  try {
    const score = await UserVenueScore.findOne({ uid, venue_id });
    if (!score) return res.status(200).json({ feedback: "none" });

    res.status(200).json({ feedback: score.feedback || "none" });
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;