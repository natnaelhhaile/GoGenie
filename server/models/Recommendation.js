const mongoose = require('mongoose');
const locationSchema = require('./Location');

const recommendationSchema = new mongoose.Schema({
  venue_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  priority_score: { type: Number, required: true }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
