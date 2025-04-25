const express = require("express");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const Preferences = require("../models/Preferences");
const User = require("../models/User");
const Recommendation = require("../models/Recommendation");
const UserVenueScore = require("../models/UserVenueScore");
const { calculateCosineSimilarity } = require("../utils/similarity");
const { generateFoursquareQueries } = require("../services/openAIService");
const { fetchFoursquareVenues, fetchVenuePhotos , fetchVenueDetails} = require("../services/foursquareService");
const tagsVocabulary = require("../utils/tagsVocabulary");
const extractTagsFromFeatures = require("../utils/extractTagsFromFeatures");

const router = express.Router();

const MAX_DISTANCE = 10000;

// Route to generate venue recommendations
router.get("/generate-recommendations", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log("generate recs route reached")

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found." });

    // Get user preferences
    const userPreferences = await Preferences.findOne({ uid });
    if (!userPreferences) {
      console.log("No preferences found for user:", uid);
      return res.status(204).json({ message: "No preferences found" });
    }

    // Generate queries and fetch venues
    const queries = await generateFoursquareQueries(user.tagWeights);
    if (!queries || queries.length === 0) {
      return res.status(404).json({ message: "No queries returned" });
    }

    console.log(queries);
    console.log(userPreferences.location);

    const venues = await fetchFoursquareVenues(queries, userPreferences.location);
    if (!venues || venues.length === 0) {
      return res.status(404).json({ message: "No venues found" });
    }

    const savedVenues = [];

    for (const venue of venues) {
      const existingVenue = await Recommendation.findOne({ venue_id: venue.fsq_id });

      const tagWeights = user.tagWeights || {};
      const userVector = tagsVocabulary.map(tag => tagWeights[tag] || 0);
      const venueTags = extractTagsFromFeatures(venue.features || {});
      const venueVector = tagsVocabulary.map(tag =>
        venueTags.includes(tag.toLowerCase()) ? 1 : 0
      );

      const similarity = calculateCosineSimilarity(userVector, venueVector);

      const distance = venue.distance || MAX_DISTANCE;
      const proximityScore = Math.max(0, 1 - distance / MAX_DISTANCE);

      const ratingScore = typeof venue.rating === "number" ? venue.rating / 10 : 0.5;

      const priorityScore = (
        similarity * 0.4 +
        proximityScore * 0.4 +
        ratingScore * 0.2
      ).toFixed(3);

      const photoURLs = await fetchVenuePhotos(venue.fsq_id);

      let finalVenue;
      if (!existingVenue) {
        const newVenue = new Recommendation({
          venue_id: venue.fsq_id,
          name: venue.name,
          location: {
            address: venue.location.address,
            formattedAddress: venue.location.formattedAddress,
            locality: venue.location.locality,
            region: venue.location.region,
            country: venue.location.country,
            postcode: venue.location.postcode,
          },
          categories: venue.categories.map(cat => cat.name),
          tags: venueTags,
          rating: venue.rating,
          link: venue.link,
          photos: photoURLs,
          distance,
          users: [uid]
        });

        finalVenue = await newVenue.save();
      } else {
        if (!existingVenue.users.includes(uid)) {
          existingVenue.users.push(uid);
          await existingVenue.save();
        }
        finalVenue = existingVenue;
      }

      await UserVenueScore.findOneAndUpdate(
        { uid: uid, venue_id: venue.fsq_id },
        { priorityScore: parseFloat(priorityScore) },
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

// GET /api/recommendations/cached-recommendations?offset=0&limit=10
router.get("/cached-recommendations", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const userScores = await UserVenueScore
      .find({ uid })
      .sort({ priorityScore: -1 })
      .skip(offset)
      .limit(limit);

    if (!userScores.length) {
      return res.status(204).json({ recommendations: [] });
    }

    const venueIds = userScores.map(s => s.venue_id);
    const venueDocs = await Recommendation.find({ venue_id: { $in: venueIds } });

    const venueMap = new Map(venueDocs.map(v => [v.venue_id, v]));

    const scoredVenues = userScores.map(scoreEntry => {
      const venue = venueMap.get(scoreEntry.venue_id);
      return venue ? {
        venue,
        priorityScore: scoreEntry.priorityScore
      } : null;
    }).filter(Boolean);

    res.status(200).json({ recommendations: scoredVenues });
  } catch (err) {
    console.error("Error fetching paginated recommendations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// endpoint to get venue details by fsq_id: popularity,stats,hours,rating
router.get("/details/:venue_id", async (req, res) => {
  const { venue_id } = req.params;
  try {
    const venue = await fetchVenueDetails(venue_id);
    res.status(200).json(venue);
  } catch (error) {
    console.error("Error fetching venue details:", error);
    res.status(500).json({ message: "Failed to fetch venue details" });
  }
});


module.exports = router;