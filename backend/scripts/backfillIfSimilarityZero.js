import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Recommendation from "../models/Recommendation.js";
import UserVenueScore from "../models/UserVenueScore.js";
import tagsVocabulary from "../utils/tagsVocabulary.js";
import { calculateCosineSimilarity } from "../utils/similarity.js";

dotenv.config();

const MAX_DISTANCE = 40000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

const debugScores = async () => {
  try {
    const scores = await UserVenueScore.find({});
    console.log(`🔍 Found ${scores.length} user-venue scores to inspect\n`);

    for (const score of scores) {
      const { uid, venue_id } = score;
      const user = await User.findOne({ uid });
      const venue = await Recommendation.findOne({ venue_id });

      if (!user || !venue) {
        console.warn(`⚠️ Missing user or venue: ${uid}, ${venue_id}`);
        continue;
      }

      const tagWeights = user.tagWeights || {};
      const venueTags = venue.tags || [];

      const userVector = tagsVocabulary.map(tag => tagWeights[tag] || 0);
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

      // Debug print when similarity is zero
      if (similarity === 0) {
        console.log(`❗ ZERO SIMILARITY for UID: ${uid}, Venue: ${venue.name}`);
        console.log(`   ➤ User tagWeights >`, JSON.stringify(tagWeights, null, 2));
        console.log(`   ➤ Venue tags     >`, venueTags);
        console.log(`   ➤ User vector    >`, userVector);
        console.log(`   ➤ Venue vector   >`, venueVector);
        console.log("------------------------------------------------------------");
      }

      // Always save updated breakdowns
      score.priorityScore = parseFloat(priorityScore);
      score.scoreBreakdown = {
        similarity: parseFloat(similarity.toFixed(3)),
        proximity: parseFloat(proximityScore.toFixed(3)),
        rating: parseFloat(ratingScore.toFixed(3))
      };

      await score.save();
    }

    console.log("\n✅ Similarity debug run complete.");
  } catch (error) {
    console.error("❌ Error during debug run:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

await connectDB();
await debugScores();