const express = require("express");
const Preferences = require("../models/Preferences");
const Recommendation = require("../models/Recommendation");
const UserVenueScore = require("../models/UserVenueScore");
const { calculateCosineSimilarity } = require("../utils/similarity");
const { generateFoursquareQueries } = require("../services/openAIService");
const { fetchFoursquareVenues } = require("../services/foursquareService");
const tagsVocabulary = require("../utils/tagsVocabulary");
const extractTagsFromFeatures = require("../utils/extractTagsFromFeatures");

const router = express.Router();
const MAX_DISTANCE = 10000;

router.get("/user-venues/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const cachedVenues = await Recommendation.find({ user: userId }).limit(10);
    if (cachedVenues.length > 0) {
      return res.status(200).json({ recommendations: cachedVenues });
    }

    const userPreferences = await Preferences.findOne({ user: userId });
    if (!userPreferences) {
      return res.status(404).json({ message: "No preferences found" });
    }

    const queries = await generateFoursquareQueries({
      hobbies: userPreferences.hobbies,
      foodPreferences: userPreferences.foodPreferences,
      thematicPreferences: userPreferences.thematicPreferences,
    });

    const venues = await fetchFoursquareVenues(queries, userPreferences.location);
    if (!venues || venues.length === 0) {
      return res.status(404).json({ message: "No venues found" });
    }

    const savedVenues = [];

    for (const venue of venues) {
      const existingVenue = await Recommendation.findOne({ venue_id: venue.fsq_id });

      const venueRating = venue.rating || 4.0;
      const ratingScore = (venueRating - 3) / 2;
      const distance = venue.distance || MAX_DISTANCE;
      const proximityScore = Math.max(0, 1 - distance / MAX_DISTANCE);

      const userTags = [
        ...(userPreferences.hobbies || []),
        ...(userPreferences.foodPreferences || []),
        ...(userPreferences.thematicPreferences || [])
      ].map(t => t.toLowerCase());

      const venueTags = extractTagsFromFeatures(venue.features || {});

      const userVector = tagsVocabulary.map(tag => userTags.includes(tag.toLowerCase()) ? 1 : 0);
      const venueVector = tagsVocabulary.map(tag => venueTags.includes(tag.toLowerCase()) ? 1 : 0);

      const similarityScore = calculateCosineSimilarity(userVector, venueVector);

      const priorityScore = (
        similarityScore * 0.5 +
        proximityScore * 0.3 +
        ratingScore * 0.2
      ).toFixed(3);

      let finalVenue;
      if (!existingVenue) {
        const newVenue = new Recommendation({
          venue_id: venue.fsq_id,
          name: venue.name,
          category: venue.categories?.[0]?.name || "Unknown",
          features: venue.features,
          tags: venueTags,
          location: {
            address: venue.location.formatted_address,
            latitude: venue.geocodes?.main?.latitude,
            longitude: venue.geocodes?.main?.longitude,
          },
          link: venue.link,
          photos: {
            prefix: venue.photos?.[0]?.prefix || "",
            suffix: venue.photos?.[0]?.suffix || "",
          },
          distance,
        });
        finalVenue = await newVenue.save();
      } else {
        finalVenue = existingVenue;
      }

      await UserVenueScore.findOneAndUpdate(
        { user: userId, venue_id: venue.fsq_id },
        { priority_score: parseFloat(priorityScore) },
        { upsert: true, new: true }
      );

      savedVenues.push({ venue: finalVenue, priorityScore });
    }

    return res.status(200).json({ recommendations: savedVenues });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/ranked-recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: Find all user-specific venue scores, ordered by highest score
    const userScores = await UserVenueScore.find({ user: userId }).sort({ priority_score: -1 });

    if (!userScores.length) {
      return res.status(404).json({ message: "No personalized scores found for this user." });
    }

    // Step 2: Collect all venue IDs from scores
    const venueIds = userScores.map(s => s.venue_id);

    // Step 3: Fetch venue details for those IDs
    const venueDocs = await Recommendation.find({ venue_id: { $in: venueIds } });

    // Step 4: Match venue data to score entries
    const scoredVenues = userScores.map(scoreEntry => {
      const venue = venueDocs.find(v => v.venue_id === scoreEntry.venue_id);
      return venue ? {
        venue,
        priority_score: scoreEntry.priority_score
      } : null;
    }).filter(Boolean);

    return res.status(200).json({ recommendations: scoredVenues });
  } catch (err) {
    console.error("Error fetching ranked recommendations:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;