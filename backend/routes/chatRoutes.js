import dotenv from "dotenv";
dotenv.config();
import express from "express";
import OpenAI from "openai";
import verifyFirebaseToken from "../middleware/firebaseAuth.js";
import Preferences from "../models/Preferences.js";
import Recommendation from "../models/Recommendation.js";
import ChatHistory from "../models/ChatHistory.js";
import { isValidTextField, escapeRegex } from "../utils/validators.js";

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(userMessage, userPreferences, venues = []) {
  const basePrompt = `
You are GoGenie, a helpful venue recommendation assistant. You answer user questions in a conversational way. You suggest venues
from a given list based on the user's hobbies, preferences, and situation. You can also answer questions about specific venues using
their metadata like name, rating, open hours, category, or popularity.

- If recommending a venue, retain the venue id of the venue and return a JSON object with the structure:
  {
    "type": "recommendation",
    "venue": {
      "venue_id": "venue_id",
      "name": "Venue Name",
      "category": "Category",
      "address": "Full Address",
      "description": "Short conversational reason why this place is good"
    }
  }
- If responding conversationally without a venue, return:
  {
    "type": "text",
    "message": "Your response text here"
  }

User Preferences:
- Hobbies: ${userPreferences.hobbies.join(", ")}
- Food Preferences: ${userPreferences.foodPreferences.join(", ")}
- Thematic Interests: ${userPreferences.thematicPreferences.join(", ")}
- Lifestyle: ${userPreferences.lifestylePreferences.join(", ")}

Venues Available:
${venues.map(v =>
    `- ${v.name} (${v.categories.join(", ")}) — Located at ${v.location.address}, ${v.location.locality}, ${v.location.region}, ${v.location.country}`
  ).join("\n")}

Now respond to the following user query
"${userMessage}"

Use JSON as the only output.
`;

  return basePrompt;
}

router.post("/venue-assistant", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { message } = req.body;

    if (!isValidTextField(message)) {
      return res.status(400).json({ error: "Invalid message format." });
    }

    const userPreferences = await Preferences.findOne({ uid });
    const recommendedVenues = await Recommendation.find({ users: { $in: [uid] } }).limit(10);

    if (!userPreferences || recommendedVenues.length === 0) {
      return res.status(404).json({ error: "User or recommendations not found" });
    }

    const prompt = buildPrompt(message, userPreferences, recommendedVenues);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a venue assistant chatbot." },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    });

    const replyContent = response.choices?.[0]?.message?.content;

    try {
      const parsed = JSON.parse(replyContent);
      res.status(200).json({ reply: parsed });
    } catch (err) {
      console.error("❌ JSON parse error:", err.message);
      res.status(200).json({
        reply: {
          type: "text",
          message: replyContent || "Sorry, I couldn't format that.",
        },
      });
    }
  } catch (error) {
    console.error("❌ Venue Assistant Error:", error.message);
    res.status(500).json({ error: "Failed to generate a reply" });
  }
});

router.get("/venue-name", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name } = req.query;

    if (!name || !isValidTextField(name)) {
      return res.status(400).json({ error: "Invalid or missing venue name." });
    }

    const escapedName = escapeRegex(name.trim());

    const venue = await Recommendation.findOne({
      name: { $regex: new RegExp(`^${escapedName}`, "i") }
    });

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    console.log("Venue found:", venue);
    return res.status(200).json(venue);
  } catch (error) {
    console.error("❌ Error fetching venue by name:", error.message);
    res.status(500).json({ error: "Server error while fetching venue" });
  }
});

router.post("/save-chat-history", verifyFirebaseToken, async (req, res) => {
  try {
    const { chatHistory } = req.body;
    const uid = req.user.uid;

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: "Invalid chat history format." });
    }

    await ChatHistory.findOneAndUpdate(
      { uid },
      { $set: { history: chatHistory } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Chat history saved successfully." });
  } catch (error) {
    console.error("❌ Error saving chat history backend:", error.message);
    res.status(500).json({ error: "Server error saving chat." });
  }
});

export default router;