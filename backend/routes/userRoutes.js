import express from "express";
import verifyFirebaseToken from "../middleware/firebaseAuth.js";
import User from "../models/User.js";
import Preferences from "../models/Preferences.js";
import buildTagWeights from "../utils/tagWeightBuilder.js";
import generatePreferenceSummary from "../utils/aiPreferenceSummary.js";
import {
  isValidName,
  isValidAge,
  isValidTextField,
  isValidStringArray
} from "../utils/validators.js";

const router = express.Router();

// Create user if new
router.post("/check-new-user", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    // Check if user exists
    let user = await User.findOne({ $or: [{ uid }, { email }] });

    if (!user) {
      user = new User({ uid, email });
      await user.save();
      console.log("✅ New user created:", user.email);
    } else {
      console.log("ℹ️ User already exists:", user.email);
    }

    // Check for preferences
    const existingPrefs = await Preferences.findOne({ uid });
    const hasPreferences = !!existingPrefs;
    console.log("Preferences found: ", hasPreferences);

    res.status(200).json({
      message: "User authenticated successfully",
      hasPreferences
    });

  } catch (error) {
    console.error("Error in login/register:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Fetch preferences
router.get("/preferences", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const preferences = await Preferences.findOne({ uid });

    if (!preferences) {
      return res.status(204).json({ message: "Preferences not found" });
    }

    res.status(200).json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Create preferences with validation
router.post("/preferences", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const {
      fname,
      lname,
      age,
      gender,
      nationality,
      industry,
      location,
      hobbies,
      foodPreferences,
      thematicPreferences,
      lifestylePreferences,
    } = req.body;

    // Basic field validation
    if (!isValidName(fname)) return res.status(400).json({ message: "Invalid first name." });
    if (!isValidName(lname)) return res.status(400).json({ message: "Invalid last name." });
    if (!isValidAge(Number(age))) return res.status(400).json({ message: "Invalid age." });
    if (!["male", "female", "nonBinary", "preferNot"].includes(gender))
      return res.status(400).json({ message: "Invalid gender option." });
    if (!isValidTextField(nationality)) return res.status(400).json({ message: "Invalid nationality." });
    if (!isValidTextField(industry)) return res.status(400).json({ message: "Invalid profession/industry." });

    // Validate required arrays
    const requiredArrays = [
      { name: "hobbies", value: hobbies },
      { name: "foodPreferences", value: foodPreferences },
      { name: "thematicPreferences", value: thematicPreferences },
      { name: "lifestylePreferences", value: lifestylePreferences },
    ];

    for (const field of requiredArrays) {
      if (!Array.isArray(field.value) || field.value.some(item => typeof item !== "string")) {
        return res.status(400).json({ message: `${field.name} must be an array of strings.` });
      }
    }

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Build location object with support for lat/lng and optional text
    let locationPayload = undefined;
    if (location?.lat && location?.lng) {
      locationPayload = {
        lat: location.lat,
        lng: location.lng,
        text: typeof location.text === "string" && isValidTextField(location.text)
          ? location.text.trim()
          : undefined,
        updatedAt: new Date(),
        coordinates: [location.lng, location.lat],
      };
    } else if (typeof location?.text === "string") {
      if (!isValidTextField(location.text)) {
        return res.status(400).json({ message: "Invalid location text." });
      }
      locationPayload = {
        text: location.text.trim(),
        updatedAt: new Date()
      };
    }

    const preferences = new Preferences({
      uid,
      fname: fname.trim(),
      lname: lname.trim(),
      age: Number(age),
      gender,
      nationality: nationality.trim(),
      industry: industry.trim(),
      hobbies,
      foodPreferences,
      thematicPreferences,
      lifestylePreferences,
      location: locationPayload
    });

    await preferences.save();

    const tagWeights = buildTagWeights({
      hobbies,
      foodPreferences,
      thematicPreferences,
      lifestylePreferences
    });

    await User.findOneAndUpdate({ uid }, { tagWeights }, { upsert: true });

    res.status(200).json({
      message: "Preferences and tagWeights saved successfully.",
      preferences
    });

  } catch (error) {
    console.error("❌ Error saving preferences:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Update preferences subset (hobbies, foodPreferences, thematicPreferences)
router.put("/preferences", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { hobbies, foodPreferences, thematicPreferences, lifestylePreferences } = req.body;
  const updates = {};

  const requiredArrays = [
    { name: "hobbies", value: hobbies },
    { name: "foodPreferences", value: foodPreferences },
    { name: "thematicPreferences", value: thematicPreferences },
    { name: "lifestylePreferences", value: lifestylePreferences }
  ];
  
  for (const field of requiredArrays) {
    if (!isValidStringArray(field.value)) 
      return res.status(400).json({ message: `${field.name} must be an array of strings.` });
    updates[field.name] = field.value;
  }

  updates["summary"] = undefined;
  updates["summaryUpdatedAt"] = undefined;

  try {
    const updated = await Preferences.findOneAndUpdate(
      { uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Updated user preferences not found." });
    }

    const tagWeights = buildTagWeights(updated);
    await User.findOneAndUpdate({ uid }, { tagWeights }, { upsert: true });

    res.status(200).json({ message: "Preferences and tagWeights updated successfully.", preferences: updated });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update basic user details (fname, lname, age, gender, nationality, etc.)
router.put("/details", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const {
    fname,
    lname,
    age,
    gender,
    nationality,
    industry,
    location,
  } = req.body;

  const updates = {};

  // Validate and assign fields
  if (fname) {
    if (!isValidName(fname)) {
      return res.status(400).json({ message: "Invalid first name." });
    }
    updates.fname = fname.trim();
  }

  if (lname) {
    if (!isValidName(lname)) {
      return res.status(400).json({ message: "Invalid last name." });
    }
    updates.lname = lname.trim();
  }

  if (age !== undefined) {
    const numericAge = parseInt(age, 10);
    if (!isValidAge(numericAge)) {
      return res.status(400).json({ message: "Invalid age. Must be 1–120." });
    }
    updates.age = numericAge;
  }

  if (gender) {
    const validGenders = ["male", "female", "nonBinary", "preferNot"];
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ message: "Invalid gender option." });
    }
    updates.gender = gender;
  }

  if (nationality) {
    if (!isValidTextField(nationality)) {
      return res.status(400).json({ message: "Invalid nationality." });
    }
    updates.nationality = nationality.trim();
  }

  if (industry) {
    if (!isValidTextField(industry)) {
      return res.status(400).json({ message: "Invalid profession or industry." });
    }
    updates.industry = industry.trim();
  }

  // Location validation: either lat/lng or text
  if (location?.lat && location?.lng) {
    updates.location = {
      lat: location.lat,
      lng: location.lng,
      updatedAt: new Date(),
    };
  } else if (typeof location?.text === "string") {
    if (!isValidTextField(location.text)) {
      return res.status(400).json({ message: "Invalid location text." });
    }
    updates.location = {
      text: location.text.trim(),
      updatedAt: new Date(),
    };
  }

  try {
    const updated = await Preferences.findOneAndUpdate(
      { uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User details updated successfully.",
      preferences: updated,
    });
  } catch (error) {
    console.error("❌ Error updating user details:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Generates a short summary of user preferences using AI
router.get("/summary", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const preferences = await Preferences.findOne({ uid });

    if (!preferences) {
      console.warn(`⚠️ Preferences not found for UID: ${uid}`);
      return res.status(204).json({ message: "Preferences not found" });
    }

    if (preferences.summary && preferences.summaryUpdatedAt) {
      console.log("📦 Returning cached summary");
      return res.status(200).json({ summary: preferences.summary });
    }

    console.log("⏳ Generating new summary...");
    const summary = await generatePreferenceSummary(preferences);

    if (!summary) {
      console.warn("⚠️ Summary generation returned null");
      return res.status(500).json({ message: "Summary generation failed" });
    }

    preferences.summary = summary;
    preferences.summaryUpdatedAt = new Date();
    await preferences.save();

    console.log("✅ Summary saved to DB");
    return res.status(200).json({ summary });
  } catch (error) {
    console.error("❌ Error in /summary route:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;