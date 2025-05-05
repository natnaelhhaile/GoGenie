import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Preferences from "../models/Preferences.js";
import Recommendation from "../models/Recommendation.js";
import UserVenueScore from "../models/UserVenueScore.js";
import { calculateCosineSimilarity } from "../utils/similarity.js";
import { fetchFoursquareVenuesByCoords } from "../services/foursquareService.js";
import { generateFoursquareQueries } from "../services/openAIService.js";
import extractTagsFromFeatures from "../utils/extractTagsFromFeatures.js";
import { addToVocabulary } from "../utils/vocabularyManager.js"
import { getCachedVocabulary } from "../utils/vocabularyCache.js";
import { fetchVenuePhotos } from "../services/foursquareService.js";

dotenv.config();

const MAX_DISTANCE = 40000;

async function generateForUser(uid) {
  try {
    const user = await User.findOne({ uid });
    if (!user) return console.warn(`⚠️ User not found: ${uid}`);

    const prefs = await Preferences.findOne({ uid });
    if (!prefs) return console.warn(`⚠️ Preferences not found for: ${uid}`);

    const queries = await generateFoursquareQueries(user.tagWeights);
    if (!queries || queries.length === 0) return;

    const location = prefs.location;
    if (!location?.lat || !location?.lng) return;

    const venues = await fetchFoursquareVenuesByCoords(queries, {
      lat: location.lat,
      lng: location.lng,
      radius: MAX_DISTANCE
    });

    if (!venues?.length) return;

    for (const venue of venues) {
      const existingVenue = await Recommendation.findOne({ venue_id: venue.fsq_id });
      const venueTags = extractTagsFromFeatures(venue.features || {}, venue.categories || []);
      await addToVocabulary(venueTags);

      const vocab = await getCachedVocabulary();
      const tagWeights = user.tagWeights || {};
      const userVector = vocab.map(tag => tagWeights[tag] || 0);
      const venueVector = vocab.map(tag => venueTags.includes(tag.toLowerCase()) ? 1 : 0);

      const similarity = calculateCosineSimilarity(userVector, venueVector);
      const distance = venue.distance || MAX_DISTANCE;
      const proximityScore = Math.max(0, 1 - distance / MAX_DISTANCE);
      const ratingScore = typeof venue.rating === "number" ? venue.rating / 10 : 0.5;

      const priorityScore = (
        similarity * 0.6 + proximityScore * 0.2 + ratingScore * 0.2
      ).toFixed(3);

      // photo handling
      let photoURLs = [];
      if (venue.photos?.length > 0) {
        photoURLs = venue.photos
          .filter(p => p.prefix && p.suffix)
          .map(p => `${p.prefix}original${p.suffix}`);
      }
      if (photoURLs.length === 0) {
        photoURLs = await fetchVenuePhotos(venue.fsq_id);
      }

      let finalVenue;
      if (!existingVenue) {
        finalVenue = await new Recommendation({
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
        }).save();
      } else {
        if (!existingVenue.users.includes(uid)) {
          existingVenue.users.push(uid);
          await existingVenue.save();
        }
        finalVenue = existingVenue;
      }

      // Check feedback
      const userVenueScore = await UserVenueScore.findOne({ uid, venue_id: venue.fsq_id });

      if (!userVenueScore || userVenueScore.feedback === "none") {
        await UserVenueScore.findOneAndUpdate(
          { uid, venue_id: venue.fsq_id },
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
    }

    console.log(`✅ Processed user: ${uid}`);
  } catch (err) {
    console.error(`❌ Error processing user ${uid}:`, err);
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const users = await User.find({}, "uid");
  for (const { uid } of users) {
    await generateForUser(uid);
  }

  console.log("🎉 Done generating recommendations for all users.");
  mongoose.disconnect();
}

main();