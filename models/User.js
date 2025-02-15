const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  preferences: { type: mongoose.Schema.Types.ObjectId, ref: 'Preference' } // Foreign Key
});

module.exports = mongoose.model('User', userSchema);
