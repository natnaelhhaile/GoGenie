function extractTagsFromFeatures(features = {}, categories = []) {
  const tags = [];

  // Feature-based tag extraction (existing logic)
  function traverse(obj) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        traverse(value);
      } else if (typeof value === "boolean" && value === true) {
        tags.push(key);
      } else if (typeof value === "string" && ["Average", "Great"].includes(value)) {
        tags.push(key);
      } else if (typeof value === "object" && value && Object.keys(value).length === 0) {
        tags.push(key);
      }
    }
  }

  traverse(features);

  // Add categories as tags
  if (Array.isArray(categories)) {
    categories.forEach(cat => {
      if (typeof cat === "string") {
        tags.push(cat);
      } else if (cat && typeof cat.name === "string") {
        tags.push(cat.name);
      }
    });
  }

  // Normalize tags
  const normalized = tags
    .map(tag => tag.trim().toLowerCase().replace(/[\s&]+/g, "").replace(/[^\w]/g, ""))
    .filter(Boolean);

  return [...new Set(normalized)];
}

export default extractTagsFromFeatures;