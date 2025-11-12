import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

// Create matcher with English dataset
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Checks if text contains hateful/profane language
 * @param text - The text to check
 * @returns true if hateful content is detected
 */
export const containsHatefulLanguage = (text: string): boolean => {
  if (!text) return false;
  return matcher.hasMatch(text);
};

/**
 * Extract all bad words found in text
 */
const extractBadWords = (text: string): string[] => {
  if (!text) return [];

  const matches = matcher.getAllMatches(text);
  return matches.map(match => text.substring(match.startIndex, match.endIndex));
};

/**
 * Clean text by censoring bad words
 * @param text - The text to clean
 * @returns cleaned text with bad words censored
 */
export const cleanText = (text: string): string => {
  if (!text) return text;

  const matches = matcher.getAllMatches(text);

  if (matches.length === 0) return text;

  let cleaned = text;
  // Replace matches in reverse order to maintain indices
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i];
    const length = match.endIndex - match.startIndex;
    const censored = '*'.repeat(length);
    cleaned = cleaned.substring(0, match.startIndex) + censored + cleaned.substring(match.endIndex);
  }

  return cleaned;
};

/**
 * Moderate content and return details
 */
export const moderateContent = (content: {
  title?: string;
  text?: string;
  tags?: string[];
}): {
  isHateful: boolean;
  detectedIn: string[];
  badWords: Record<string, string[]>;
} => {
  const detectedIn: string[] = [];
  const badWords: Record<string, string[]> = {};

  if (content.title) {
    const found = extractBadWords(content.title);
    if (found.length > 0) {
      detectedIn.push('title');
      badWords.title = found;
    }
  }

  if (content.text) {
    const found = extractBadWords(content.text);
    if (found.length > 0) {
      detectedIn.push('text');
      badWords.text = found;
    }
  }

  if (content.tags) {
    const tagsText = content.tags.join(' ');
    const found = extractBadWords(tagsText);
    if (found.length > 0) {
      detectedIn.push('tags');
      badWords.tags = found;
    }
  }

  return {
    isHateful: detectedIn.length > 0,
    detectedIn,
    badWords,
  };
};
