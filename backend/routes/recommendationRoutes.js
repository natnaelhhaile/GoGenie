import express from "express";
import verifyFirebaseToken from "../middleware/firebaseAuth.js";
import Preferences from "../models/Preferences.js";
import User from "../models/User.js";
import Recommendation from "../models/Recommendation.js";
import UserVenueScore from "../models/UserVenueScore.js";
import Sharing from "../models/Sharing.js";
import RSVP from "../models/RSVP.js";
import { calculateCosineSimilarity } from "../utils/similarity.js";
import { generateFoursquareQueries } from "../services/openAIService.js";
import {
  fetchFoursquareVenuesByCoords,
  fetchVenuePhotos
} from "../services/foursquareService.js";
import { addToVocabulary } from "../utils/vocabularyManager.js";
import { getCachedVocabulary } from "../utils/vocabularyCache.js";
import extractTagsFromFeatures from "../utils/extractTagsFromFeatures.js";
import { 
  isValidSearchQuery, 
  isValidVenueId,
} from "../utils/validators.js";

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
      const venueTags = extractTagsFromFeatures(venue.features || {}, venue.categories || []);
      await addToVocabulary(venueTags || []);

      const tagWeights = user.tagWeights || {};
      const vocab = await getCachedVocabulary();
      const userVector = vocab.map(tag => tagWeights[tag] || 0);
      const venueVector = vocab.map(tag =>
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

      // Photo handling logic
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

      // Check if the user has provided feedback (like/dislike) for the venue or if the venue has a score
      const userVenueScore = await UserVenueScore.findOne({ uid, venue_id: venue.fsq_id });

      // Update the priority score only if the feedback is "none"
      if (!userVenueScore || userVenueScore.feedback === "none") {
        await UserVenueScore.findOneAndUpdate(
          { uid: uid, venue_id: venue.fsq_id },
          { 
            priorityScore: parseFloat(priorityScore),
            scoreBreakdown: {
              similarity: parseFloat(similarity.toFixed(3)),
              proximity: parseFloat(proximityScore.toFixed(3)),
              rating: parseFloat(ratingScore.toFixed(3))
            }
          },
          { upsert: true, new: true }
        );
      }

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
        priorityScore: scoreEntry.priorityScore,
        scoreBreakdown: scoreEntry.scoreBreakdown
      } : null;
    }).filter(Boolean);

    res.status(200).json({
      recommendations: scoredVenues
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
      venue_id: { $ne: topLikedVenueId }, // exclude itself
      users: {$nin: [uid] } // exclude venues already associated with this user
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

// GET route for venue details
router.get("/details/:venue_id", verifyFirebaseToken, async (req, res) => {
  const uid = req.user?.uid; // Get logged-in user's UID
  const { venue_id } = req.params;
  const { share } = req.query; // Retrieve the share token if present

  try {
    // Validate the venue_id
    if (!isValidVenueId(venue_id)) {
      return res.status(400).json({ message: "Invalid venue ID" });
    }

    // Check if it's a shared link
    if (share) {
      // If the request is coming from a shared link (guest user)
      const sharingRecord = await Sharing.findOne({ share_link: share });

      if (!sharingRecord) {
        return res.status(404).json({ message: "Shared link not found" });
      }

      // Fetch venue details from the venue ID associated with the shared link
      const venue = await Recommendation.findOne({ venue_id: sharingRecord.venue_id });

      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }

      // Fetch RSVP responses for the shared venue
      const rsvpStatus = await RSVP.find({ venue_id: venue.venue_id });

      return res.status(200).json({
        venue,
        rsvpStatus,  // Return RSVP responses
      });

    } else {
      // If the request is coming from a logged-in user
      const venue = await Recommendation.findOne({ venue_id });

      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }

      // Fetch the logged-in user's personal feedback and priority score
      const userScore = await UserVenueScore.findOne({ uid, venue_id });

      return res.status(200).json({
        rating: venue.rating || "No rating available",
        popularity: venue.popularity || "N/A",
        stats: venue.stats || { total_ratings: 0, total_tips: 0, total_photos: 0 },
        hours: venue.hours || "Hours not available",
        tips: venue.tips || [],
        priorityScore: userScore?.priorityScore || "N/A",  // User-specific score
        scoreBreakdown: userScore?.scoreBreakdown || null  // User-specific breakdown
      });
    }
  } catch (error) {
    console.error("Error fetching venue details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;