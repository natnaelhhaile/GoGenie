// scripts/backfillTagWeights.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Preferences from "../models/Preferences.js";
import buildTagWeights from "../utils/tagWeightBuilder.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
await mongoose.connect(MONGO_URI);
console.log("✅ Connected to MongoDB");

async function backfillAllUsers() {
  const preferencesList = await Preferences.find({});
  console.log(`🔁 Updating ${preferencesList.length} users...`);

  let updatedCount = 0;
  for (const prefs of preferencesList) {
    const { uid } = prefs;
    const tagWeights = buildTagWeights(prefs);

    const updated = await User.findOneAndUpdate(
      { uid },
      { tagWeights },
      { new: true }
    );

    if (updated) {
      updatedCount++;
      console.log(`✅ Updated tagWeights for: ${updated.email || uid}`);
    }
  }

  console.log(`🎉 Done. Total users updated: ${updatedCount}`);
  mongoose.disconnect();
}

backfillAllUsers().catch(err => {
  console.error("❌ Error in backfill script:", err);
  mongoose.disconnect();
});