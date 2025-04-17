const express = require('express');
const User = require('../models/User');
const Preferences = require('../models/Preferences');

const router = express.Router();

// Register a new user | Not implemented with firebase only firebase is used need to save them in mongoDB
router.post('/register', async (req, res) => {
  try {
    const { fName, lName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" })
    }

    user = new User({ fName, lName, email, password });
    await user.save();

    res.status(201).json({ message: "Account created successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// New routes for 1. login|register | 2. preferences |  March 13, 2024
// ✅ Check if user exists, if not, create one
router.post("/login-or-register", async (req, res) => {
  console.log("request accepted")
  try {
    const { userId, email } = req.body;

    // ✅ Check if user exists in database
    let user = await User.findOne({ user_id: userId });

    if (!user) {
      // ✅ If user doesn't exist, create a new user
      user = new User({ user_id: userId, email });
      await user.save();
      console.log("✅ New user created:", user);
    }

    res.status(200).json({ message: "User authenticated successfully", userId });
  } catch (error) {
    console.error("❌ Error in login/register:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to Save or Update User Preferences
router.post("/preferences", async (req, res) => {
  try {
    const { userId, name, age, gender, nationality, industry, location, hobbies, foodPreferences, thematicPreferences } = req.body;

    // Check if user exists
    const user = await User.findOne({user_id : userId});
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if preferences already exist for user
    let preferences = await Preferences.findOne({ user: userId });

    if (preferences) {
      // ✅ Update existing preferences
      preferences.name = name;
      preferences.age = age;
      preferences.gender = gender;
      preferences.nationality = nationality;
      preferences.industry = industry;
      preferences.location = location;
      preferences.hobbies = hobbies;
      preferences.foodPreferences = foodPreferences;
      preferences.thematicPreferences = thematicPreferences;
    } else {
      // ✅ Create new preferences document
      preferences = new Preferences({
        user: userId, // now it is stored as a string
        name,
        age,
        gender,
        nationality,
        industry,
        location,
        hobbies,
        foodPreferences,
        thematicPreferences
      });
    }

    await preferences.save();
    res.status(200).json({ message: "Preferences updated successfully!", preferences });

  } catch (error) {
    console.log("❌ Error saving preferences(userRoute):", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to Fetch user with preferences
router.get("/preferences/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Find the user's preferences
    const preferences = await Preferences.findOne({ user: userId });

    if (!preferences) {
      return res.status(200).json();
    }

    res.status(200).json(preferences);
  } catch (error) {
    console.error("❌ Error fetching preferences:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// the whole profile set up here from dashboard with navigate("/profile-setup") to here
// Route to update preferences 
// router.put("/preferences/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { name, age, gender, nationality, industry, location, hobbies, foodPreferences, thematicPreferences } = req.body;

//     // ✅ Find user preferences
//     let preferences = await Preferences.findOne({ user: userId });

//     if (!preferences) {
//       return res.status(404).json({ message: "Preferences not found" });
//     }

//     // ✅ Update preferences
//     preferences.name = name;
//     preferences.age = age;
//     preferences.gender = gender;
//     preferences.nationality = nationality;
//     preferences.industry = industry;
//     preferences.location = location;
//     preferences.hobbies = hobbies;
//     preferences.foodPreferences = foodPreferences;
//     preferences.thematicPreferences = thematicPreferences;

//     await preferences.save();
//     res.status(200).json({ message: "Preferences updated successfully!", preferences });

//   } catch (error) {
//     console.error("❌ Error updating preferences:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// April 16, Siem
// ✅ PUT: Update user preferences only
router.put("/preferences/:userId", async (req, res) => {
  const { userId } = req.params;
  const { hobbies, foodPreferences, thematicPreferences } = req.body;

  try {
    const updated = await Preferences.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          hobbies,
          foodPreferences,
          thematicPreferences,
        },
      },
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

// Update user details: name, username, age, gender, nationality
router.put("/details/:userId", async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    const updated = await Preferences.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User preferences not found." });
    }

    return res.status(200).json({
      message: "Preferences updated successfully.",
      preferences: updated,
    });
  } catch (error) {
    console.error("❌ Error updating preferences:", error);
    return res.status(500).json({ message: "Server error." });
  }
});



module.exports = router;
