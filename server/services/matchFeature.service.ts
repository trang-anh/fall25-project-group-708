import mongoose from 'mongoose';
import { PopulatedDatabaseMatchProfile, ProgrammingLanguage } from '../types/types';
/**
 * Extract features from user match profile into a vector of numbers for further processing and score computing for match compability.
 * @param a a user's populated match profle
 * @param b a user's populated match profle
 * @returns a vector of features scores
 */
export default function extractFeatures(
  a: PopulatedDatabaseMatchProfile,
  b: PopulatedDatabaseMatchProfile,
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

// ----- helpers -----
type LanguageEntry =
  | ProgrammingLanguage
  | mongoose.Types.ObjectId
  | { _id?: mongoose.Types.ObjectId };

function getLangId(lang: LanguageEntry): string {
  if (isProgrammingLanguage(lang)) {
    return lang.name;
  }

  if (isObjectId(lang)) {
    return lang.toHexString(); // ✔ NO eslint warning
  }

  // Case 3: { _id: ObjectId }
  if (hasId(lang)) {
    return lang._id.toHexString(); // ✔ NO eslint warning
  }

  // If you ever hit this, it's programmer error — NOT implicit stringification
  throw new Error('Invalid LanguageEntry: missing name or ObjectId');
}

/** Type guard: { name: string } */
function isProgrammingLanguage(lang: LanguageEntry): lang is { name: string } {
  return (
    typeof lang === 'object' &&
    lang !== null &&
    'name' in lang &&
    typeof (lang as { name: unknown }).name === 'string'
  );
}

/** Type guard: direct ObjectId */
function isObjectId(lang: LanguageEntry): lang is mongoose.Types.ObjectId {
  return lang instanceof mongoose.Types.ObjectId;
}

/** Type guard: { _id: ObjectId } */
function hasId(lang: LanguageEntry): lang is { _id: mongoose.Types.ObjectId } {
  return (
    typeof lang === 'object' &&
    lang !== null &&
    '_id' in lang &&
    lang._id instanceof mongoose.Types.ObjectId
  );
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
function jaccard(a?: LanguageEntry[], b?: LanguageEntry[]): number {
  if (!a?.length || !b?.length) return 0;

  const setA = new Set(a.map(getLangId));
  const setB = new Set(b.map(getLangId));

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
function matchPreferredLang(
  a: PopulatedDatabaseMatchProfile,
  b: PopulatedDatabaseMatchProfile,
): number {
  const userALangs = a.programmingLanguage?.map(getLangId) || [];
  const prefs = b.preferences?.preferredLanguages?.map(getLangId) || [];
  return userALangs.some(l => prefs.includes(l)) ? 1 : 0;
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
  const tA = new Set(a.toLowerCase().split(/\W+/));
  const tB = new Set(b.toLowerCase().split(/\W+/));
  const overlap = [...tA].filter(x => tB.has(x)).length;
  return overlap / Math.max(tA.size, tB.size);
}
