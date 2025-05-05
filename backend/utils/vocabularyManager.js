import TagsVocabulary from "../models/TagsVocabulary.js";
import { refreshVocabulary } from "./vocabularyCache.js";

/**
 * Get all tags in the current vocabulary.
 */
export const getVocabulary = async () => {
  let vocabDoc = await TagsVocabulary.findOne();
  if (!vocabDoc) {
    vocabDoc = await TagsVocabulary.create({ tags: [] });
  }
  return vocabDoc.tags;
};

/**
 * Add new tags to the vocabulary (if they don't already exist).
 * Automatically deduplicates and normalizes.
 */
export const addToVocabulary = async (newTags = []) => {
  if (!Array.isArray(newTags)) return;

  const normalized = newTags
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  let vocabDoc = await TagsVocabulary.findOne();
  if (!vocabDoc) {
    vocabDoc = await TagsVocabulary.create({ tags: [...new Set(normalized)] });
    return vocabDoc.tags;
  }

  const currentSet = new Set(vocabDoc.tags);
  let updated = false;

  for (const tag of normalized) {
    if (!currentSet.has(tag)) {
      currentSet.add(tag);
      updated = true;
    }
  }

  if (updated) {
    vocabDoc.tags = [...currentSet];
    vocabDoc.updatedAt = new Date();
    await vocabDoc.save();
    await refreshVocabulary();
  }

  return vocabDoc.tags;
};