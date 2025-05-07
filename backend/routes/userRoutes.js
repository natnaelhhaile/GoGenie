import express from "express";
import { verifyFirebaseToken, optionalVerifyFirebase } from "../middleware/firebaseAuth.js";
import User from "../models/User.js";
import Preferences from "../models/Preferences.js";
import RSVP from '../models/RSVP.js';
import Sharing from '../models/Sharing.js';
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

// POST route to submit RSVP for logged-in user - /api/users/...
router.post("/rsvp", verifyFirebaseToken, async (req, res) => {
  const { response, shareToken } = req.body;
  const uid = req.user.uid;

  if (!["yes", "no", "maybe"].includes(response) || !uid || !shareToken) {
    return res.status(400).json({ message: "Invalid RSVP data." });
  }

  try {
    const sharingRecord = await Sharing.findOne({ token: shareToken });
    if (!sharingRecord || new Date() > new Date(sharingRecord.expiresAt)) {
      return res.status(403).json({ message: "Invalid or expired share token." });
    }

    const sharing_id = sharingRecord._id;

    const rsvp = await RSVP.findOneAndUpdate(
      { sharing_id, uid },
      { sharing_id, uid, response },
      { upsert: true, new: true }
    );

    // Push RSVP ID into Sharing (if not already present)
    await Sharing.updateOne(
      { _id: sharing_id, rsvps: { $ne: rsvp._id } },
      { 
        $addToSet: {
          rsvps: rsvp._id,
          shared_with: uid
        }
      }
    );

    return res.status(200).json({ message: "RSVP saved.", rsvp });

  } catch (err) {
    console.error("Error saving RSVP:", err);
    return res.status(500).json({ message: "Server error saving RSVP." });
  }
});

// POST route to handle guest RSVP
router.post("/rsvp/guest", optionalVerifyFirebase, async (req, res) => {
  const { response, guestId, shareToken } = req.body;
  console.log(shareToken, guestId, response);

  if (!["yes", "no", "maybe"].includes(response) || !guestId || !shareToken) {
    return res.status(400).json({ message: "Invalid guest RSVP data." });
  }

  try {
    const sharingRecord = await Sharing.findOne({ token: shareToken });
    if (!sharingRecord || new Date() > new Date(sharingRecord.expiresAt)) {
      return res.status(403).json({ message: "Invalid or expired share token." });
    }

    const sharing_id = sharingRecord._id;
    console.log("sharing_id: ", sharing_id);

    const rsvp = await RSVP.findOneAndUpdate(
      { sharing_id, guestId },
      {
        $set: {
          sharing_id,
          guestId,
          response
        },
        $unset: { uid: "", venue_id: "" }
      },
      { upsert: true, new: true }
    );

    // Push RSVP ID into Sharing (if not already present)
    await Sharing.updateOne(
      { _id: sharing_id, rsvps: { $ne: rsvp._id } },
      { $addToSet: { rsvps: rsvp._id } }
    );

    return res.status(200).json({ message: "Guest RSVP saved.", rsvp });

  } catch (err) {
    console.error("Error saving guest RSVP:", err);
    return res.status(500).json({ message: "Server error saving guest RSVP." });
  }
});

/**
 * GET /api/rsvp/status
 * Get the current RSVP status for a user or guest
 * Pass venue_id + uid (auto from auth) OR guestId via query
 */
router.get("/rsvp/status", async (req, res) => {
  const { shareToken, guestId } = req.query;

  if (!shareToken) return res.status(400).json({ message: "Missing share token" });

  try {
    const sharing = await Sharing.findOne({ token: shareToken });
    if (!sharing) return res.status(404).json({ message: "Invalid share token" });

    let rsvp;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      req.user = await verifyFirebaseToken(token, true); // silent mode
      if (req.user?.uid) {
        rsvp = await RSVP.findOne({ sharing_id: sharing._id, uid: req.user.uid });
      }
    } else if (guestId) {
      rsvp = await RSVP.findOne({ sharing_id: sharing._id, guestId });
    }

    return res.status(200).json({ rsvpStatus: rsvp?.response || null });
  } catch (err) {
    console.error("Error fetching RSVP status:", err);
    return res.status(500).json({ message: "Error fetching RSVP status" });
  }
});

export default router;