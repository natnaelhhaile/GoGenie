const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  history: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model("ChatHistory", chatHistorySchema);