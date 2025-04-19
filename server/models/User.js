const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // standardize emails
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
