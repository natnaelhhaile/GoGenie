const express = require("express");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const Preferences = require("../models/Preferences");
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

    // Get user preferences
    const userPreferences = await Preferences.findOne({ uid });
    if (!userPreferences) {
      console.log("No preferences found for user:", uid);
      return res.status(404).json({ message: "No preferences found" });
    }

    // Generate queries and fetch venues
    const queries = await generateFoursquareQueries({
      hobbies: userPreferences.hobbies,
      foodPreferences: userPreferences.foodPreferences,
      thematicPreferences: userPreferences.thematicPreferences,
      lifestylePreferences: userPreferences.lifestylePreferences
    });
    console.log(queries);
    console.log(userPreferences.location);

    const venues = await fetchFoursquareVenues(queries, userPreferences.location);
    if (!venues || venues.length === 0) {
      return res.status(404).json({ message: "No venues found" });
    }

    const savedVenues = [];

    for (const venue of venues) {
      const existingVenue = await Recommendation.findOne({ venue_id: venue.fsq_id });

      const userTags = [
        ...(userPreferences.hobbies || []),
        ...(userPreferences.foodPreferences || []),
        ...(userPreferences.thematicPreferences || []),
        ...(userPreferences.lifestylePreferences || [])
      ].map(t => t.toLowerCase());

      const venueTags = extractTagsFromFeatures(venue.features || {});

      const userVector = tagsVocabulary.map(tag =>
        userTags.includes(tag.toLowerCase()) ? 1 : 0
      );
      const venueVector = tagsVocabulary.map(tag =>
        venueTags.includes(tag.toLowerCase()) ? 1 : 0
      );

      const similarity = calculateCosineSimilarity(userVector, venueVector);

      const distance = venue.distance || MAX_DISTANCE;
      const proximityScore = Math.max(0, 1 - distance / MAX_DISTANCE);

      const hasRating = typeof venue.rating === 'number';
      const normalizedRating = hasRating ? venue.rating / 10 : 0.5;

      const priorityScore = (
        similarity * 0.5 +
        proximityScore * 0.3 +
        normalizedRating * 0.2
      ).toFixed(3);

      const photoURLs = await fetchVenuePhotos(venue.fsq_id);

      let finalVenue;
      if (!existingVenue) {
        const newVenue = new Recommendation({
          venue_id: venue.fsq_id,
          name: venue.name,
          location: {
            address: venue.location.address,
            formatted_address: venue.location.formatted_address,
            locality: venue.location.locality,
            region: venue.location.region,
            country: venue.location.country,
            postcode: venue.location.postcode,
          },
          categories: venue.categories.map(cat => cat.name),
          features: venueTags,
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

// Route to fetch cached/ranked venue recommendations
router.get("/cached-recommendations", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const userScores = await UserVenueScore
      .find({ uid })
      .sort({ priorityScore: -1 });

    if (!userScores.length) {
      // ✅ Return empty list with 200 OK
      return res.status(200).json({ recommendations: [] });
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

    return res.status(200).json({ recommendations: scoredVenues });
  } catch (err) {
    console.error("Error fetching ranked recommendations:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// endpoint to get venue details by fsq_id: popularity,stats,hours,rating
// later maybe user verifyFirebaseToken
router.get("/details/:venueId", async (req, res) => {
  const { venueId } = req.params;
  try {
    const venue = await fetchVenueDetails(venueId);
    res.status(200).json(venue);
  } catch (error) {
    console.error("Error fetching venue details:", error);
    res.status(500).json({ message: "Failed to fetch venue details" });
  }
});


module.exports = router;