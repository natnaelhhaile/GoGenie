import mongoose from "mongoose";
import dotenv from "dotenv";
import Recommendation from "../models/Recommendation.js";
import { addToVocabulary } from "../utils/vocabularyManager.js";
import extractTagsFromFeatures from "../utils/extractTagsFromFeatures.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

const backfillVenueTags = async () => {
  try {
    const venues = await Recommendation.find({});
    console.log(`🔍 Found ${venues.length} venues to process`);

    const allNewTags = new Set();

    for (const venue of venues) {
      const features = venue.features || {};
      const categories = venue.categories || [];

      const extractedTags = extractTagsFromFeatures(features, categories);
      const currentTags = venue.tags || [];
      const mergedTags = Array.from(new Set([...currentTags, ...extractedTags]));

      venue.tags = mergedTags;
      await venue.save();

      extractedTags.forEach(tag => allNewTags.add(tag));
      console.log(`✅ Updated ${venue.name}: ${mergedTags.length} tags`);
    }

    // Update global tag vocabulary
    await addToVocabulary(Array.from(allNewTags));
    console.log("📚 Vocabulary updated");

    console.log("🎉 Venue tags backfill complete.");
  } catch (error) {
    console.error("❌ Error during backfill:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

await connectDB();
await backfillVenueTags();