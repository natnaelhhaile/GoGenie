const mongoose = require("mongoose");

const PreferencesSchema = new mongoose.Schema({
  uid: { 
    type: String, 
    ref: "User", 
    required: true, 
    unique: true, 
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
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  nationality: { type: String, required: true },
  industry: { type: String, required: true },
  location: { type: String, required: true },
  hobbies: { type: [String], required: true },
  foodPreferences: { type: [String], required: true },
  thematicPreferences: { type: [String], required: true },
  lifestylePreferences: { type: [String], required: true },
  summary: { type: String },
  summaryUpdatedAt: { type: Date }  
});

module.exports = mongoose.model("Preferences", PreferencesSchema);
