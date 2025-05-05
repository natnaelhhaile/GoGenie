import mongoose from "mongoose";

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
  },
  tagWeights: { 
    type: Map, 
    of: Number, 
    default: {} // Initialize with empty object
  },
  tagFeedbackCount: { 
    type: Map, 
    of: Number, 
    default: {} 
  },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

export default User;