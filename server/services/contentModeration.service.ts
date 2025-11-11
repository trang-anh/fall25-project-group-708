interface BadWordsFilter {
  isProfane(text: string): boolean;
  clean(text: string): string;
}

import BadWords from 'bad-words';

const filter = BadWords as unknown as { new (): BadWordsFilter };

const filterWords = new filter();

/**
 * Checks if text contains hateful/profane language
 */
export const containsHatefulLanguage = (text: string): boolean => {
  if (!text) return false;
  return filterWords.isProfane(text);
};

/**
 * Extract all bad words from text (based on default bad-words list)
 */
const extractBadWords = (text: string): string[] => {
  const words = text.split(/\s+/);
  return words.filter(word => filterWords.isProfane(word));
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
      badWords['title'] = found;
    }
  }

  if (content.text) {
    const found = extractBadWords(content.text);
    if (found.length > 0) {
      detectedIn.push('text');
      badWords['text'] = found;
    }
  }

  if (content.tags) {
    const tagsText = content.tags.join(' ');
    const found = extractBadWords(tagsText);
    if (found.length > 0) {
      detectedIn.push('tags');
      badWords['tags'] = found;
    }
  }

  return {
    isHateful: detectedIn.length > 0,
    detectedIn,
    badWords,
  };
};

/**
 * Optional: Get cleaned version of text
 */
export const cleanText = (text: string): string => {
  return filterWords.clean(text);
};
