import mongoose from "mongoose";

const TagsVocabularySchema = new mongoose.Schema({
  tags: {
    type: [String],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("TagsVocabulary", TagsVocabularySchema);