function extractTagsFromFeatures(features) {
    const tags = [];
  
    function traverse(obj) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Dive deeper into nested object
          traverse(value);
        } else if (typeof value === "boolean" && value === true) {
          tags.push(key); // Include if true
        } else if (typeof value === "string" && ["Average", "Great"].includes(value)) {
          tags.push(key); // Include if it's "Average" or "Great"
        } else if (typeof value === "object" && value && Object.keys(value).length === 0) {
          // Handle empty object as present = true
          tags.push(key);
        }
      }
    }
  
    traverse(features);
    return tags;
  }
  
module.exports = extractTagsFromFeatures;  