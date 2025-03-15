const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateFoursquareQueries = async (preferences) => {
  try {
    const preferenceText = `
      The user has selected these preferences:
      - Hobbies: ${preferences.hobbies.join(", ")}
      - Food Preferences: ${preferences.foodPreferences.join(", ")}
      - Thematic Preferences: ${preferences.thematicPreferences.join(", ")}

      Generate **3 structured search queries** optimized for Foursquare API.
      - Do **NOT** include any location or city name.
      - Use categories like "cafe", "live music venue", "bookstore", "outdoor park".
      - Queries should be **short and precise**.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert in location-based recommendations and Foursquare search optimization." },
        { role: "user", content: preferenceText }
      ]
    });

    return response.choices[0].message.content
      .split("\n") // Convert OpenAI response to array
      .map(q => q.trim()) // Remove whitespace
      .filter(q => q.length > 0); // Remove empty strings
  } catch (error) {
    console.error("❌ OpenAI Error:", error);
    return [];
  }
};

module.exports = { generateFoursquareQueries };
