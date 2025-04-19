const express = require("express");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const User = require("../models/User");
const Preferences = require("../models/Preferences");

const router = express.Router();

// Utility: Validate arrays of strings
const isValidStringArray = (arr) => Array.isArray(arr) && arr.every(item => typeof item === "string");

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
    console.error("❌ Error in login/register:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Fetch preferences
router.get("/preferences", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const preferences = await Preferences.findOne({ uid });

    if (!preferences) {
      return res.status(404).json({ message: "Preferences not found" });
    }

    res.status(200).json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Create or overwrite preferences with validation
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

    const requiredArrays = [
      { name: "hobbies", value: hobbies },
      { name: "foodPreferences", value: foodPreferences },
      { name: "thematicPreferences", value: thematicPreferences },
      { name: "lifestylePreferences", value: lifestylePreferences },
    ];

    for (const field of requiredArrays) {
      if (!isValidStringArray(field.value)) {
        return res.status(400).json({ message: `${field.name} must be an array of strings.` });
      }
    }

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const preferences = new Preferences({
      uid,
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
      lifestylePreferences
    });
    
    await preferences.save();    

    res.status(200).json({ message: "Preferences saved successfully!", preferences });
  } catch (error) {
    console.error("❌ Error saving preferences:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Update preferences subset (hobbies, foodPreferences, thematicPreferences)
router.put("/preferences", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { hobbies, foodPreferences, thematicPreferences } = req.body;

  const updates = {};

  if (hobbies) {
    if (!isValidStringArray(hobbies))
      return res.status(400).json({ message: "Hobbies must be an array of strings." });
    updates.hobbies = hobbies;
  }

  if (foodPreferences) {
    if (!isValidStringArray(foodPreferences))
      return res.status(400).json({ message: "Food preferences must be an array of strings." });
    updates.foodPreferences = foodPreferences;
  }

  if (thematicPreferences) {
    if (!isValidStringArray(thematicPreferences))
      return res.status(400).json({ message: "Thematic preferences must be an array of strings." });
    updates.thematicPreferences = thematicPreferences;
  }

  try {
    const updated = await Preferences.findOneAndUpdate(
      { uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Preferences not found for user." });
    }

    res.status(200).json({ message: "Preferences updated successfully.", preferences: updated });
  } catch (error) {
    console.error("❌ Error updating preferences:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ✅ Update basic user details (fname, lname, age, gender, nationality, etc.)
router.put("/details", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const updateData = req.body;

  try {
    const updated = await Preferences.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User preferences not found." });
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

module.exports = router;
