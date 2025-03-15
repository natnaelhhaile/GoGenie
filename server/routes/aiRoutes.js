const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ AI Route: Generate Personalized Recommendations
router.post("/generate-recommendations", async (req, res) => {
  try {
    const { userId, name, hobbies, foodPreferences, thematicPreferences } = req.body;

    // ✅ Construct a prompt for GPT-4
    const prompt = `
      User: ${name}
      Hobbies: ${hobbies.join(", ")}
      Food Preferences: ${foodPreferences.join(", ")}
      Thematic Preferences: ${thematicPreferences.join(", ")}

      Based on this information, recommend 3 places the user would love to visit. 
      Each recommendation should include:
      1. Name of the place
      2. Type (e.g., Restaurant, Park, Live Music Venue)
      3. A short AI-generated description explaining why it’s a good match.
      4. Estimated distance (random between 5-30 minutes).
    `;

    // ✅ Call OpenAI API (GPT-4)
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      },
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
    );

    const aiGeneratedText = response.data.choices[0].message.content;

    res.status(200).json({ recommendations: aiGeneratedText });
  } catch (error) {
    console.error("❌ Error generating recommendations:", error);
    res.status(500).json({ message: "AI processing error", error });
  }
});

module.exports = router;
