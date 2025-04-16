const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true, // Optimized lookups using Firebase UID
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // standardize emails
    trim: true
  },
  fname: {
    type: String,
    trim: true,
    default: ""
  },
  lname: {
    type: String,
    trim: true,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
