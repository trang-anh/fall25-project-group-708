import { MatchProfileWithUser } from '../types/types';

/**
 * Extract features from user match profile into a vector of numbers for further processing and score computing for match compability.
 * @param a a user's populated match profle
 * @param b a user's populated match profle
 * @returns a vector of features scores
 */
export default function extractFeatures(
  a: MatchProfileWithUser,
  b: MatchProfileWithUser,
): number[] {
  // compute jaccard score for programming lang overlaps
  const skillOverlap = jaccard(a.programmingLanguage, b.programmingLanguage);
  const levelSim = levelSimilarity(a.level, b.level);
  const preferredLangMatch = matchPreferredLang(a, b);
  const goalSim = textSimilarity(a.onboardingAnswers?.goals, b.onboardingAnswers?.goals);
  const personalitySim = textSimilarity(
    a.onboardingAnswers?.personality,
    b.onboardingAnswers?.personality,
  );
  const projectSim = textSimilarity(
    a.onboardingAnswers?.projectType,
    b.onboardingAnswers?.projectType,
  );

  return [skillOverlap, levelSim, preferredLangMatch, goalSim, personalitySim, projectSim];
}

/**
 * Calculates the Jaccard similarity score between two sets of programming languages.
 *
 * The score is the size of the intersection divided by the size of the union
 * of the two language sets.
 *
 * - Returns 0 if either input is empty or undefined.
 *
 * @param a - The first user's list of programming languages.
 * @param b - The second user's list of programming languages.
 * @returns A similarity score between 0 and 1.
 */
function jaccard(a?: string[], b?: string[]): number {
  if (!a?.length || !b?.length) return 0;

  const setA = new Set(a);
  const setB = new Set(b);

  let intersection = 0;

  for (const value of setA) {
    if (setB.has(value)) {
      intersection += 1;
    }
  }

  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize === 0 ? 0 : intersection / unionSize;
}

/**
 * Computes a similarity score between two experience levels.
 *
 * Levels are compared based on their distance within an ordered scale:
 * BEGINNER -> INTERMEDIATE -> ADVANCED.
 *
 * - Returns 1.0 if levels match.
 * - Returns 0.5 if one level is missing.
 * - Returns 0 when they differ by the max distance.
 * @param a The first user's skill level.
 * @param b The second user's skill level.
 * @returns A similarity score between 0 and 1.
 */
function levelSimilarity(a?: string, b?: string): number {
  if (!a || !b) return 0.5;

  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  const diff = Math.abs(levels.indexOf(a) - levels.indexOf(b));

  return 1 - diff / 2;
}

/**
 * Determines if one user's programming languages match another user's preferences.
 *
 * Returns 1 if any of the first user's languages appear in the second user's
 * preferredLanguages list, otherwise returns 0.
 *
 * @param a - The first user's populated match profile.
 * @param b - The second user's populated match profile.
 * @returns 1 if there is a language match, otherwise 0.
 */
function matchPreferredLang(a: MatchProfileWithUser, b: MatchProfileWithUser): number {
  const userALangs = a.programmingLanguage || [];
  const prefs = b.preferences?.preferredLanguages || [];

  return userALangs.some(lang => prefs.includes(lang)) ? 1 : 0;
}

/**
 * Calculates a simple text similarity score between two strings.
 *
 * Converts both strings to lowercase, tokenizes them by non-word characters,
 * and computes the overlap ratio based on shared unique tokens.
 *
 * - Returns 0 if either string is empty or undefined.
 *
 * @param [a] - The first text input.
 * @param [b] - The second text input.
 * @returns A similarity score between 0 and 1.
 */
function textSimilarity(a?: string, b?: string): number {
  if (!a || !b) return 0;

  const tokensA = new Set(a.toLowerCase().split(/\W+/));
  const tokensB = new Set(b.toLowerCase().split(/\W+/));

  const overlap = [...tokensA].filter(t => tokensB.has(t)).length;

  return overlap / Math.max(tokensA.size, tokensB.size);
}
