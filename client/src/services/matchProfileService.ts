/**
 * Service layer for match profile and match operations
 * Updated to match backend controller routes exactly
 */

import { DatabaseMatchProfile, MatchProfile } from '../types/types';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MATCH_PROFILE_BASE_API = `${apiBaseUrl}/api/matchProfile`;

/**
 * Get a user's match profile
 */
export const getMatchProfile = async (userId: string): Promise<DatabaseMatchProfile> => {
  const res = await fetch(`${MATCH_PROFILE_BASE_API}/getMatchProfile/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch match profile');
  return res.json();
};

/**
 * Get all match profiles (for discovery)
 */
export const getAllMatchProfiles = async (): Promise<DatabaseMatchProfile[]> => {
  const res = await fetch(`${MATCH_PROFILE_BASE_API}/getAllMatchProfiles/`);
  if (!res.ok) throw new Error('Failed to fetch match profiles');
  return res.json();
};

/**
 * Create a new match profile
 */
export const createMatchProfile = async (
  profileData: MatchProfile,
): Promise<DatabaseMatchProfile> => {
  const res = await fetch(`${MATCH_PROFILE_BASE_API}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error('Failed to create match profile');
  return res.json();
};

/**
 * Update a user's match profile
 */
export const updateMatchProfile = async (
  userId: string,
  updates: Partial<MatchProfile>,
): Promise<DatabaseMatchProfile> => {
  const res = await fetch(`${MATCH_PROFILE_BASE_API}/updateMatchProfile/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update match profile');
  return res.json();
};

/**
 * Toggle match profile active status
 * Backend expects BOTH userId and isActive in the body
 */
export const toggleMatchProfileActive = async (
  userId: string,
  isActive: boolean,
): Promise<DatabaseMatchProfile> => {
  const res = await fetch(`${MATCH_PROFILE_BASE_API}/toggleMatchProfileActive/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isActive }),
  });
  if (!res.ok) throw new Error('Failed to toggle active status');
  return res.json();
};

/**
 * Check if user has completed onboarding
 */
export const checkOnboardingStatus = async (
  userId: string,
): Promise<{ exists: boolean; isActive: boolean }> => {
  const res = await fetch(`${MATCH_PROFILE_BASE_API}/checkOnboardingStatus/${userId}`);
  if (!res.ok) throw new Error('Failed to check onboarding status');
  return res.json();
};

/**
 * Calculate compatibility score between two profiles
 */
export const calculateCompatibilityScore = (
  userProfile: DatabaseMatchProfile,
  otherProfile: DatabaseMatchProfile,
): number => {
  let score = 0;

  // Check programming language overlap
  const userLangs = userProfile.programmingLanguage || [];
  const otherLangs = otherProfile.programmingLanguage || [];
  const langOverlap = userLangs.filter(l => otherLangs.includes(l)).length;
  score += langOverlap * 20;

  // Check if other user matches preferences
  const preferredLangs = userProfile.preferences?.preferredLanguages || [];
  const preferredLangMatch = otherLangs.filter(l => preferredLangs.includes(l)).length;
  score += preferredLangMatch * 15;

  return Math.min(score, 100);
};
