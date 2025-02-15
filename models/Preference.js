const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gender: { type: String, required: true },
  age_range: { type: String, required: true },
  profession: { type: String, required: true },
  drink_preferences: { type: [String], required: true },
  general_themes: { type: [String], required: true },
  entertainment_prefs: { type: [String], required: true },
  search_history: { type: [String], default: [] },
  recommendations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recommendation' }]
});

module.exports = mongoose.model('Preference', preferenceSchema);
