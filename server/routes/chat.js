const express = require("express");
const OpenAI = require("openai");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const Preferences = require("../models/Preferences");
const Recommendation = require("../models/Recommendation");

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(userMessage, userPreferences, venues = []) {
  const basePrompt = `
You are GoGenie, a helpful venue recommendation assistant. You answer user questions in a conversational way. You suggest venues
from a given list based on the user's hobbies, preferences, and situation. You can also answer questions about specific venues using
their metadata like name, rating, open hours, category, or popularity.

User Preferences:
- Hobbies: ${userPreferences.hobbies.join(", ")}
- Food Preferences: ${userPreferences.foodPreferences.join(", ")}
- Thematic Interests: ${userPreferences.thematicPreferences.join(", ")}
- Lifestyle: ${userPreferences.lifestylePreferences.join(", ")}

Venues Available:
${venues.map(v => 
  `- ${v.name} (${v.categories.join(", ")}) — Located at ${v.location.address}, ${v.location.locality}, ${v.location.region}, ${v.location.country}`
).join("\n")}


Now respond to the following user query in a friendly and helpful way:
"${userMessage}"

Make sure your response is personalized, helpful, and based on the venue data or preferences.
`;

  return basePrompt;
}


router.post("/venue-assistant", verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { message } = req.body;

    const userPreferences = await Preferences.findOne({ uid });
    // console.log(message)
    // console.log(userPreferences);

    const recommendedVenues = await Recommendation.find({ users: { $in: [uid] } }).limit(20);
    console.log("number of venues got: ",recommendedVenues.length)
    // console.log(recommendedVenues);

    if (!userPreferences || !recommendedVenues) {
      return res.status(404).json({ error: "User or recommendations not found" });
    }

    const prompt = buildPrompt(message, userPreferences, recommendedVenues);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a venue assistant chatbot." },
        { role: "user", content: prompt },
      ],
      max_tokens: 400,
    });

    res.status(200).json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("❌ Venue Assistant Error:", error.message);
    res.status(500).json({ error: "Failed to generate a reply" });
  }
});

module.exports = router;
