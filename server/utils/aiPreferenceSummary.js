const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generatePreferenceSummary = async (preferences) => {
  const {
    hobbies = [],
    foodPreferences = [],
    thematicPreferences = [],
    lifestylePreferences = [],
  } = preferences;

  const prompt = `
Based on the following user preferences, generate a single, engaging one-sentence summary that reflects their interests and vibe.

- Hobbies: ${hobbies.join(", ")}
- Food: ${foodPreferences.join(", ")}
- Themes: ${thematicPreferences.join(", ")}
- Lifestyle: ${lifestylePreferences.join(", ")}

Avoid repeating category names like "hobbies" or "food". Start with something like:
- "You're someone who..."
- "You clearly enjoy..."
- "Your vibe is..."

Make it friendly, fun, and unique. Don't exceed 25 words.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at crafting friendly, insightful lifestyle summaries based on user interests.",
        },
        { role: "user", content: prompt },
      ],
    });

    console.log("🔍 OpenAI raw response:", JSON.stringify(response, null, 2));

    const summary = response.choices?.[0]?.message?.content?.trim();

    if (!summary || summary.length < 5) {
      console.warn("⚠️ OpenAI returned an empty or too short summary:", summary);
      return null;
    }

    console.log("✅ Generated summary:", summary);
    return summary;
  } catch (error) {
    console.error("❌ OpenAI summary generation failed:", error);
    return null;
  }
};

module.exports = generatePreferenceSummary;