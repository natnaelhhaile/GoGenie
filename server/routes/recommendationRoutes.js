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

// changes: no userId neede
router.get("/user-venues", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const cachedVenues = await Recommendation.find({ user: uid }).limit(10);
    if (cachedVenues.length > 0) {
      return res.status(200).json({ recommendations: cachedVenues });
    }

    const userPreferences = await Preferences.findOne({ uid: uid });
    if (!userPreferences) {
      console.log("No preferences found for user:", uid);
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
      
      const userTags = [
        ...(userPreferences.hobbies || []),
        ...(userPreferences.foodPreferences || []),
        ...(userPreferences.thematicPreferences || [])
      ].map(t => t.toLowerCase());
      
      const venueTags = extractTagsFromFeatures(venue.features || {});
      
      const userVector = tagsVocabulary.map(tag => userTags.includes(tag.toLowerCase()) ? 1 : 0);
      const venueVector = tagsVocabulary.map(tag => venueTags.includes(tag.toLowerCase()) ? 1 : 0);
      
      const similarity = calculateCosineSimilarity(userVector, venueVector);
      
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

      let finalVenue;
      if (!existingVenue) {
        const photoURLs = await fetchVenuePhotos(venue.fsq_id);

        const newVenue = new Recommendation({
          venue_id: venue.fsq_id,
          name: venue.name,
          category: venue.categories?.[0]?.name || "Unknown",
          features: venue.features,
          rating: venue.rating,
          priority: venue.priority,
          tags: venueTags,
          location: {
            address: venue.location.formatted_address,
            latitude: venue.geocodes?.main?.latitude,
            longitude: venue.geocodes?.main?.longitude,
          },
          link: venue.link,
          photos: photoURLs,
          distance,
        });
        finalVenue = await newVenue.save();
      } else {
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

router.get("/ranked-recommendations/:userId", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Step 1: Find all user-specific venue scores, ordered by highest score
    const userScores = await UserVenueScore.find({ uid: uid }).sort({ priorityScore: -1 });

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