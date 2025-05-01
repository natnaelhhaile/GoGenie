import mongoose from "mongoose";

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
    required: true 
  },
  lname: {
    type: String,
    trim: true,
    required: true 
  },
  age: { type: Number, required: true },
  gender: { 
    type: String, 
    required: true,
    enum: ["male", "female", "nonBinary", "preferNot"]
  },  
  nationality: { type: String, required: true },
  industry: { type: String, required: true },
  location: {   
    lat: { type: Number, default: undefined },
    lng: { type: Number, default: undefined },
    text: { type: String, trim: true, default: undefined },
    updatedAt: { type: Date, default: Date.now },
    coordinates: {
      type: [Number], // [lng, lat] — GeoJSON format!
      index: "2dsphere", // enables geospatial queries
      default: undefined
    }
  },
  hobbies: { type: [String], required: true },
  foodPreferences: { type: [String], required: true },
  thematicPreferences: { type: [String], required: true },
  lifestylePreferences: { type: [String], required: true },
  summary: { type: String },
  summaryUpdatedAt: { type: Date }  
}, { timestamps: true });

const Preferences = mongoose.model("Preferences", PreferencesSchema);

export default Preferences;