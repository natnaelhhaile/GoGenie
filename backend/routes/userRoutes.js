import express from "express";
import verifyFirebaseToken from "../middleware/firebaseAuth.js";
import User from "../models/User.js";
import Preferences from "../models/Preferences.js";
import RSVP from '../models/RSVP.js';
import Sharing from "../models/Sharing.js";
import { generateShareLink } from "../utils/shareUtils.js"; // Utility to generate unique share links
import buildTagWeights from "../utils/tagWeightBuilder.js";
import generatePreferenceSummary from "../utils/aiPreferenceSummary.js";
import {
  isValidName,
  isValidAge,
  isValidTextField,
  isValidStringArray,
  isValidAddress,
  isValidVenueId,
} from "../utils/validators.js";
import geocodeAddress from "../utils/geocodeAddress.js";

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
      fname, lname, age, gender, nationality, industry,
      location, hobbies, foodPreferences, thematicPreferences, lifestylePreferences
    } = req.body;

    if (!isValidName(fname)) return res.status(400).json({ message: "Invalid first name." });
    if (!isValidName(lname)) return res.status(400).json({ message: "Invalid last name." });
    if (!isValidAge(Number(age))) return res.status(400).json({ message: "Invalid age." });
    if (!["male", "female", "nonBinary", "preferNot"].includes(gender))
      return res.status(400).json({ message: "Invalid gender option." });
    if (!isValidTextField(nationality)) return res.status(400).json({ message: "Invalid nationality." });
    if (!isValidTextField(industry)) return res.status(400).json({ message: "Invalid industry." });

    for (const field of [
      { name: "hobbies", value: hobbies },
      { name: "foodPreferences", value: foodPreferences },
      { name: "thematicPreferences", value: thematicPreferences },
      { name: "lifestylePreferences", value: lifestylePreferences }
    ]) {
      if (!isValidStringArray(field.value)) {
        return res.status(400).json({ message: `${field.name} must be an array of strings.` });
      }
    }

    let locationPayload = undefined;
    if (location?.lat && location?.lng) {
      locationPayload = {
        lat: location.lat,
        lng: location.lng,
        text: isValidAddress(location.text) ? location.text.trim() : undefined,
        updatedAt: new Date(),
        coordinates: [location.lng, location.lat],
      };
    } else if (typeof location?.text === "string" && isValidAddress(location.text)) {
      const geocoded = await geocodeAddress(location.text);
      if (geocoded) {
        locationPayload = {
          lat: geocoded.lat,
          lng: geocoded.lng,
          text: location.text.trim(),
          updatedAt: new Date(),
          coordinates: [geocoded.lng, geocoded.lat],
        };
      } else {
        return res.status(400).json({ message: "Could not geocode the provided address." });
      }
    }

    const preferences = new Preferences({
      uid,
      fname: fname.trim(),
      lname: lname.trim(),
      age: Number(age),
      gender,
      nationality: nationality.trim(),
      industry: industry.trim(),
      hobbies, foodPreferences, thematicPreferences, lifestylePreferences,
      location: locationPayload
    });

    await preferences.save();
    const tagWeights = buildTagWeights({ hobbies, foodPreferences, thematicPreferences, lifestylePreferences });
    await User.findOneAndUpdate({ uid }, { tagWeights }, { upsert: true });

    res.status(200).json({ message: "Preferences saved.", preferences });
  } catch (error) {
    console.error("POST /preferences error:", error);
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
  const { fname, lname, age, gender, nationality, industry, location } = req.body;
  const updates = {};

  if (fname && isValidName(fname)) updates.fname = fname.trim();
  if (lname && isValidName(lname)) updates.lname = lname.trim();
  if (age !== undefined && isValidAge(Number(age))) updates.age = Number(age);
  if (gender && ["male", "female", "nonBinary", "preferNot"].includes(gender)) updates.gender = gender;
  if (nationality && isValidTextField(nationality)) updates.nationality = nationality.trim();
  if (industry && isValidTextField(industry)) updates.industry = industry.trim();

  if (location?.lat && location?.lng) {
    updates.location = {
      lat: location.lat,
      lng: location.lng,
      text: isValidAddress(location.text) ? location.text.trim() : undefined,
      updatedAt: new Date(),
      coordinates: [location.lng, location.lat],
    };
  } else if (typeof location?.text === "string" && isValidAddress(location.text)) {
    const geocoded = await geocodeAddress(location.text);
    if (geocoded) {
      updates.location = {
        lat: geocoded.lat,
        lng: geocoded.lng,
        text: location.text.trim(),
        updatedAt: new Date(),
        coordinates: [geocoded.lng, geocoded.lat],
      };
    } else {
      return res.status(400).json({ message: "Could not geocode the provided address." });
    }
  }

  try {
    const updated = await Preferences.findOneAndUpdate(
      { uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ message: "User details updated successfully.", preferences: updated });
  } catch (error) {
    console.error("PUT /details error:", error);
    res.status(500).json({ message: "Server error" });
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

// POST route to submit an RSVP response
router.post("/rsvp", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { venue_id, response } = req.body;

  if (!isValidVenueId(venue_id) || !["yes", "no", "maybe"].includes(response)) {
    return res.status(400).json({ message: "Invalid RSVP response." });
  }

  try {
    // Create or update the RSVP for the user and venue
    const rsvp = await RSVP.findOneAndUpdate(
      { uid, venue_id },
      { response },
      { upsert: true, new: true } // Insert if it doesn't exist, else update
    );
    
    res.status(200).json({ message: "RSVP saved successfully.", rsvp });
  } catch (err) {
    console.error("Error saving RSVP:", err);
    res.status(500).json({ message: "Error saving RSVP." });
  }
});

// Backend route for handling guest RSVPs
router.post("/rsvp/guest", async (req, res) => {
  const { venue_id, response, guestId } = req.body;

  if (!isValidVenueId(venue_id)) {
    return res.status(400).json({ message: "Invalid venue ID." });
  }

  try {
    // Save RSVP under guest ID
    const newRSVP = new RSVP({
      venue_id,
      response,
      guestId,
      timestamp: Date.now(),
    });

    await newRSVP.save();
    res.status(200).json({ message: "RSVP saved for guest." });
  } catch (err) {
    console.error("Error saving guest RSVP:", err);
    res.status(500).json({ message: "Error saving guest RSVP." });
  }
});

// GET Route to Fetch RSVP Counts
router.get("/rsvp-counts/:venue_id", async (req, res) => {
  const { venue_id } = req.params;

  if (!isValidVenueId(venue_id)) {
    return res.status(400).json({ message: "Invalid venue_id format." });
  }

  try {
    // Get counts of Yes, No, and Maybe RSVPs for the venue
    const rsvpCounts = await RSVP.aggregate([
      { $match: { venue_id: venue_id } },
      {
        $group: {
          _id: "$response",
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = rsvpCounts.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, { yes: 0, no: 0, maybe: 0 });

    res.status(200).json({ rsvpCounts: counts });
  } catch (err) {
    console.error("Error fetching RSVP counts:", err);
    res.status(500).json({ message: "Error fetching RSVP counts." });
  }
});

// POST route to share a venue with other users
router.post("/share", verifyFirebaseToken, async (req, res) => {
  const uid = req.user.uid;
  const { venue_id, shared_with_users } = req.body; // Planner shares with a list of user IDs

  try {
    const venue = await Venue.findOne({ venue_id });
    if (!venue) {
      return res.status(404).json({ message: "Venue not found." });
    }

    const shareLink = generateShareLink(venue_id);  // Generates a unique share link for the venue
    const newShare = new Sharing({
      planner_id: uid,
      venue_id: venue_id,
      shared_with: shared_with_users,
      share_link: shareLink
    });

    await newShare.save();
    res.status(201).json({ message: "Venue shared successfully!", shareLink });
  } catch (err) {
    console.error("Error sharing venue:", err);
    res.status(500).json({ message: "Error sharing venue." });
  }
});

export default router;