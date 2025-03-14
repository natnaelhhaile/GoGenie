const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true }, // Firebase User ID
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
