const userToVenueTagMap = require("./userToVenueTagMap");

function buildTagWeights(preferences) {
  const { hobbies = [], foodPreferences = [], thematicPreferences = [], lifestylePreferences = [] } = preferences;

  const allTags = [...hobbies, ...foodPreferences, ...thematicPreferences, ...lifestylePreferences];
  const tagWeights = {};

  allTags.forEach(userTag => {
    const mapped = userToVenueTagMap[userTag];
    if (mapped) {
      mapped.forEach(venueTag => {
        tagWeights[venueTag] = (tagWeights[venueTag] || 0) + 0.7;
      });
    }
  });

  Object.keys(tagWeights).forEach(tag => {
    tagWeights[tag] = Math.min(1, tagWeights[tag]);
  });

  return tagWeights;
}

module.exports = buildTagWeights;