const express = require('express');
const mongoose = require('mongoose');
const Preference = require('../models/Preference');
const User = require('../models/User');

const router = express.Router();

// ✅ Create user preferences
router.post('/', async (req, res) => {
  try {
    let { user, gender, age_range, profession, drink_preferences, general_themes, entertainment_prefs, search_history } = req.body;

    // ✅ Convert user ID to ObjectId
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const userId = new mongoose.Types.ObjectId(user);

    // ✅ Check if user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Create preference document
    const preference = new Preference({
      user: userId,
      gender,
      age_range,
      profession,
      drink_preferences,
      general_themes,
      entertainment_prefs,
      search_history
    });

    const savedPreference = await preference.save();

    // ✅ Link preference to user
    userExists.preferences = savedPreference._id;
    await userExists.save();

    res.status(201).json({ message: "Preferences saved", preference: savedPreference });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
