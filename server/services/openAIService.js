const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateFoursquareQueries = async (tagWeights = {}) => {
  try {
  // Turn Maps into arrays of [tag, weight], or use Object.entries for objects
  const entries = tagWeights instanceof Map
    ? Array.from(tagWeights.entries())
    : Object.entries(tagWeights);

  console.log("→ entries:", entries);

  const sortedTags = entries
    .filter(([_, w]) => w > 0.4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  console.log("→ sortedTags:", sortedTags);

  if (!sortedTags.length) {
    console.warn("No tags above threshold; skipping OpenAI call.");
    return [];
  }
    const prompt = `
You are a recommendation system expert generating search queries for the Foursquare Places API.

The user is interested in the following topics (from their past preferences and feedback): 
${sortedTags.join(", ")}

👉 Generate exactly **5 short, precise search queries** using Foursquare-relevant terms (e.g., "rooftop bar", "cozy cafe", "arcade", "plant-based dining").
👉 Avoid using any specific location or city.
👉 Focus on variety: each query should represent a distinct theme or experience.
👉 Only return the queries, one per line, no extra explanations.
    `;
    console.log(prompt)
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert in location-based recommendations." },
        { role: "user", content: prompt }
      ]
    });

    const result = response.choices?.[0]?.message?.content || "";
    console.log(result)
    return result
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

  } catch (error) {
    console.error("❌ OpenAI Query Generation Error:", error.message);
    return [];
  }
};

module.exports = { generateFoursquareQueries };