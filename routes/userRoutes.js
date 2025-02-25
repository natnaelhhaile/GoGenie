const express = require('express');
const User = require('../models/User');
const Preference = require('../models/Preference');

const router = express.Router();

// ✅ Register a new user
router.post('/register', async (req, res) => {
  try {
    const { user_id, name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ user_id, name, email, password });
    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Fetch user with preferences
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('preferences');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Siem changed this comment
console.log(res.status)

module.exports = router;
