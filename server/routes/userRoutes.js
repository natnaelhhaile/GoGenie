const express = require('express');
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const User = require('../models/User');
const Preferences = require('../models/Preferences');

const router = express.Router();

// Register a new user | Not implemented with firebase only firebase is used need to save them in mongoDB
// router.post('/register', async (req, res) => {
//   try {
//     const { fName, lName, email, password } = req.body;

//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: "User already exists" })
//     }

//     user = new User({ fName, lName, email, password });
//     await user.save();

//     res.status(201).json({ message: "Account created successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });


// New routes for 1. login|register | 2. preferences |  March 13, 2024
// Check if user exists, if not, create one
router.post("/new-user", verifyFirebaseToken, async (req, res) => {
  console.log("✅ request accepted");

  try {
    const uid = req.user.uid;
    const email = req.user.email;

    // 🔍 Check if user exists by uid or email (to avoid duplication)
    let user = await User.findOne({ $or: [{ uid }, { email }] });

    if (!user) {
      user = new User({ uid, email });
      await user.save();
      console.log("✅ New user created:", user);
    } else {
      console.log("ℹ️ User already exists:", user.email);
    }

    res.status(200).json({ message: "User authenticated successfully" });
  } catch (error) {
    console.error("❌ Error in login/register:", error);
    res.status(500).json({ message: "Server error", error });
  }
});


// Route to Save or Update User Preferences
router.post("/preferences", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { fname, lname, age, gender, nationality, industry, location, hobbies, foodPreferences, thematicPreferences, lifestylePreferences } = req.body;

    // Check if user exists
    const user = await User.findOne({uid : uid});
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if preferences already exist for user
    let preferences = await Preferences.findOne({ uid: uid });

    if (preferences) {
      // Update existing preferences
      preferences.fname = fname;
      preferences.lname = lname;
      preferences.age = age;
      preferences.gender = gender;
      preferences.nationality = nationality;
      preferences.industry = industry;
      preferences.location = location;
      preferences.hobbies = hobbies;
      preferences.foodPreferences = foodPreferences;
      preferences.thematicPreferences = thematicPreferences;
      preferences.lifestylePreferences = lifestylePreferences;
    } else {
      // Create new preferences document
      preferences = new Preferences({
        uid: uid, // now it is stored as a string
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
    }

    await preferences.save();
    res.status(200).json({ message: "Preferences updated successfully!", preferences });

  } catch (error) {
    console.log("Error saving preferences(userRoute):", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Route to Fetch user with preferences
router.get("/preferences/:userId", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Find the user's preferences
    const preferences = await Preferences.findOne({ uid: uid });

    if (!preferences) {
      return res.status(200).json();
    }

    res.status(200).json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
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
router.put("/preferences/:userId", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { hobbies, foodPreferences, thematicPreferences } = req.body;

  try {
    const updated = await Preferences.findOneAndUpdate(
      { uid: uid },
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
router.put("/details/:userId", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const updateData = req.body;

  try {
    const updated = await Preferences.findOneAndUpdate(
      { uid: uid },
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