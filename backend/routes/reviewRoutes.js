import express from "express";
import Review from "../models/Review.js";
import verifyFirebaseToken from "../middleware/firebaseAuth.js";
import Preferences from "../models/Preferences.js"; 

const router = express.Router();

// GET reviews for a venue
router.get("/:venueId", async (req, res) => {
    const { venueId } = req.params; // ✅ match the route definition
    try {
      const reviews = await Review.find({ venue_id: venueId }).sort({ createdAt: -1 });
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews." });
    }
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

export default router;
