import express from "express";
import Review from "../models/Review.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";
import Preferences from "../models/Preferences.js";
import Recommendation from "../models/Recommendation.js";

const router = express.Router();

// GET reviews for a venue and calculate average rating
// This endpoint retrieves reviews for a specific venue and calculates the average rating based on user reviews and Foursquare ratings.

router.get("/:venue_id", async (req, res) => {
  const { venue_id } = req.params;

  const reviews = await Review.find({ venue_id });

  const userSum = reviews.reduce((sum, r) => sum + r.rating, 0);
  const userCount = reviews.length;

  // Fetch Foursquare rating (example: stored in Recommendation model)
  const venue = await Recommendation.findOne({ venue_id });
  const fsqRating = venue?.rating || 0;
  const fsqCount = venue?.stats?.total_ratings || 0;

  const fsqNormalized = (fsqRating / 10) * 5;

  const totalRatingSum = (fsqNormalized * fsqCount) + userSum;
  const totalCount = fsqCount + userCount;

  const avgRating = totalCount === 0 ? null : (totalRatingSum / totalCount).toFixed(1);

  res.status(200).json({ avgRating, reviews });
});

// POST new review
router.post("/", verifyFirebaseToken, async (req, res) => {
  const { venue_id, rating, comment } = req.body;
  const uid = req.user.uid;

  const userPreferences = await Preferences.findOne({ uid });
  const userName = `${userPreferences.fname} ${userPreferences.lname}` || "Anonymous";
  console.log("userName", userName);


  try {
    const review = new Review({ venue_id, uid, userName, rating, comment });
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit review." });
  }
});

// Post helpful votes
router.post("/helpful", verifyFirebaseToken, async (req, res) => {
  const { reviewId } = req.body;
  const uid = req.user.uid;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ error: "Review not found" });

  if (review.helpfulVotes.includes(uid)) {
    return res.status(204).json({ message: "You already marked this review as helpful." });
  }

  review.helpfulVotes.push(uid);
  await review.save();

  res.status(200).json({ message: "Marked as helpful", count: review.helpfulVotes.length });
});

export default router;