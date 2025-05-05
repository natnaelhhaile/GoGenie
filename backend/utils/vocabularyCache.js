import { getVocabulary } from "./vocabularyManager.js";

let cached = null;

export const getCachedVocabulary = async () => {
  if (!cached) {
    cached = await getVocabulary();
  }
  return cached;
};

// To reset if needed
export const refreshVocabulary = async () => {
  cached = await getVocabulary();
};