import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, ref: "User" },
  history: { type: Array, default: [] },
}, { timestamps: true });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;