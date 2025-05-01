import express from "express";
import verifyFirebaseToken from "../middleware/firebaseAuth.js";
import Preferences from "../models/Preferences.js";
import User from "../models/User.js";
import Recommendation from "../models/Recommendation.js";
import UserVenueScore from "../models/UserVenueScore.js";
import { calculateCosineSimilarity } from "../utils/similarity.js";
import { generateFoursquareQueries } from "../services/openAIService.js";
import {
  fetchFoursquareVenuesByCoords,
  fetchFoursquareVenuesByText,
  fetchVenuePhotos
} from "../services/foursquareService.js";
import tagsVocabulary from "../utils/tagsVocabulary.js";
import extractTagsFromFeatures from "../utils/extractTagsFromFeatures.js";
import { isValidSearchQuery } from "../utils/validators.js";

const router = express.Router();
const MAX_DISTANCE = 40000;

// Route to generate venue recommendations
router.get("/generate-recommendations", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    console.log("🔁 Generating recommendations for:", uid);

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found." });

    const userPreferences = await Preferences.findOne({ uid });
    if (!userPreferences) {
      console.log("⚠️ No preferences found for user:", uid);
      return res.status(204).json({ message: "No preferences found" });
    }

    const queries = await generateFoursquareQueries(user.tagWeights);
    if (!queries || queries.length === 0) {
      return res.status(404).json({ message: "No queries returned" });
    }

    const location = userPreferences.location;
    let venues = [];

    if (location?.lat && location?.lng) {
      console.log("📍 Using coordinates:", location.lat, location.lng);
      venues = await fetchFoursquareVenuesByCoords(queries, {
        lat: location.lat,
        lng: location.lng,
        radius: MAX_DISTANCE
      });
    } else if (typeof location?.text === "string" && location.text.trim() !== "") {
      console.log("📍 Using fallback location text:", location.text);
      venues = await fetchFoursquareVenuesByText(queries, location.text);
    } else {
      console.warn("⚠️ No valid location found.");
      return res.status(400).json({ message: "Location required to generate recommendations." });
    }

    if (!venues || venues.length === 0) {
      return res.status(404).json({ message: "No venues found." });
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
        similarity * 0.6 +
        proximityScore * 0.2 +
        ratingScore * 0.2
      ).toFixed(3);

      // ✅ Photo handling logic
      let photoURLs = [];
      if (venue.photos && Array.isArray(venue.photos) && venue.photos.length > 0) {
        photoURLs = venue.photos
          .filter(p => p.prefix && p.suffix)
          .map(p => `${p.prefix}original${p.suffix}`);
      }

      if (photoURLs.length === 0) {
        photoURLs = await fetchVenuePhotos(venue.fsq_id);
      }

      let finalVenue;
      if (!existingVenue) {
        const newVenue = new Recommendation({
          venue_id: venue.fsq_id,
          name: venue.name,
          location: {
            address: venue.location.address,
            formattedAddress: venue.location.formatted_address,
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
          popularity: venue.popularity,
          stats: venue.stats,
          hours: venue.hours,
          tips: venue.tips,
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

    console.log("✅ Recommendations generated:", savedVenues.length);
    return res.status(200).json({ recommendations: savedVenues });
  } catch (error) {
    console.error("❌ Error generating recommendations:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// cached-recommendations?offset=0&limit=10 - Route to fetch recs from db based with pagination 
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

    // 🔥 NEW: Extract and count categories
    const categoryCounts = {};
    scoredVenues.forEach(({ venue }) => {
      if (venue.categories && Array.isArray(venue.categories)) {
        venue.categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]) // sort by count desc
      .map(([cat]) => cat);        // get only the names

    res.status(200).json({
      recommendations: scoredVenues,
      categories: sortedCategories
    });
  } catch (err) {
    console.error("Error fetching paginated recommendations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to fetch top categories of user dashboard venues
router.get("/categories", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const userScores = await UserVenueScore.find({ uid });
    const venueIds = userScores.map(s => s.venue_id);

    const venueDocs = await Recommendation.find({ venue_id: { $in: venueIds } });

    const categoryCounts = {};
    venueDocs.forEach(venue => {
      if (Array.isArray(venue.categories)) {
        venue.categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat]) => cat);

    res.status(200).json({ categories: sortedCategories });
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to get the top 5 featured venues with the highest priority scores
router.get("/featured", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    // 1) grab this user's scores, sorted desc
    const topScores = await UserVenueScore.find({ uid })
      .sort({ priorityScore: -1 })
      .limit(5);
    const scoredIds = topScores.map(s => s.venue_id);

    let featured;
    if (scoredIds.length > 0) {
      // 2a) if they have scores, show those venues
      featured = await Recommendation.find({ venue_id: { $in: scoredIds } });
    } else {
      // 2b) otherwise fallback to overall popularity
      featured = await Recommendation.find()
        .sort({ popularity: -1 })
        .limit(5);
    }

    res.status(200).json({ featured });
  } catch (err) {
    console.error("❌ Error fetching featured venues:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to fetch venues a user might like based on their like/thumbs-up history
router.get("/because-you-liked", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    // 1) Find user's top liked venue
    const likes = await UserVenueScore.find({ uid, feedback: "up" })
      .sort({ priorityScore: -1 })
      .limit(1);

    if (!likes.length) {
      return res.status(204).json({ message: "No likes found" });
    }

    const topLikedVenueId = likes[0].venue_id;
    const topLikedVenue = await Recommendation.findOne({ venue_id: topLikedVenueId });

    if (!topLikedVenue) {
      return res.status(204).json({ message: "Top liked venue not found" });
    }

    const relatedTags = topLikedVenue.tags || [];
    const relatedCategories = topLikedVenue.categories || [];

    // 2) Find similar venues
    const relatedVenues = await Recommendation.find({
      $or: [
        { tags: { $in: relatedTags } },
        { categories: { $in: relatedCategories } }
      ],
      venue_id: { $ne: topLikedVenueId } // exclude itself
    }).limit(5);

    if (!relatedVenues.length) {
      return res.status(204).json({ message: "No similar venues found" });
    }

    res.status(200).json({ results: relatedVenues });

  } catch (error) {
    console.error("❌ Error fetching because-you-liked:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to fetch nearby venues
router.get("/nearby", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // 1) Load user's saved location (lat/lng) to see if the logic of nearby search applies
    const prefs = await Preferences.findOne({ uid });
    if (!prefs?.location?.lat || !prefs?.location?.lng) {
      console.warn("⚠️ No latitude/longitude available in user preferences.");
      return res.status(400).json({ message: "Location not set in your profile." });
    }

    const MAX_DIST_METERS = 10000; // 5km radius

    // 2) Find venues linked to the user and within MAX_DIST
    const nearbyVenues = await Recommendation.find({
      users: uid,
      distance: { $lte: MAX_DIST_METERS }
    })
      .sort({ distance: 1 }) // closest first
      .limit(30);

    return res.status(200).json({ results: nearbyVenues });

  } catch (err) {
    console.error("❌ Error fetching nearby venues:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// Route to look for venues that match user searches
router.get("/search", verifyFirebaseToken, async (req, res) => {
  const { query } = req.query;
  const uid = req.user.uid;

  if (!query || !isValidSearchQuery(query)) {
    return res.status(400).json({ message: "Invalid or empty search query." });
  }

  try {
    const regex = new RegExp(query, "i");

    // 1) find matching venues
    const venues = await Recommendation.find({
      $or: [
        { name: regex },
        { categories: regex },
        { tags: regex },
        { "location.formattedAddress": regex },
        { "location.locality": regex },
      ],
    }).limit(50);

    if (venues.length === 0) {
      return res.status(200).json({ results: [] });
    }

    // 2) load any existing user scores
    const venueIds = venues.map(v => v.venue_id);
    const scores = await UserVenueScore.find({
      uid,
      venue_id: { $in: venueIds }
    });

    const scoreMap = {};
    scores.forEach(s => {
      scoreMap[s.venue_id] = s.priorityScore;
    });

    // 3) sort by saved score or fallback (popularity/rating)
    const sorted = venues
      .map(v => {
        const saved = scoreMap[v.venue_id];
        const fallback = Math.min(1, ((v.popularity || v.rating || 0) / 10));
        return {
          venue: v,
          score: saved !== undefined ? saved : fallback
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)       // cap results
      .map(item => item.venue);  // unwrap

    // 4) return only the sorted venues
    res.status(200).json({ results: sorted });

  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch venue details straight from your MongoDB (Recommendation collection)
router.get("/details/:venue_id", async (req, res) => {
  const { venue_id } = req.params;

  try {
    const venue = await Recommendation.findOne({ venue_id });

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    const {
      rating,
      popularity,
      stats,
      hours,
      tips
    } = venue;

    // Format the hours display if needed
    let formattedHours = null;
    if (hours?.display) {
      formattedHours = hours.display.includes(";")
        ? hours.display.split(";").map(line => line.trim())  // split into array
        : [hours.display.trim()];                            // single line in array
    }

    return res.status(200).json({
      rating: rating || null,
      popularity: popularity || null,
      stats: stats || { total_ratings: 0, total_tips: 0, total_photos: 0 },
      hours: formattedHours,
      tips: tips || []
    });
  } catch (error) {
    console.error("❌ Error fetching venue details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;