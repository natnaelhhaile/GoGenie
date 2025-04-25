function extractTagsFromFeatures(features) {
  const tags = [];

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

  // Normalize tags: remove underscores/spaces and convert to lowercase
  return tags.map(tag => tag.replace(/[_\s]/g, "").toLowerCase());
}

module.exports = extractTagsFromFeatures;