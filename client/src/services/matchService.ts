/**
 * Service layer for match profile and match operations
 * Updated to match backend controller routes exactly
 */
import { DatabaseMatch, Match } from '../types/types';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MATCH_BASE_API = `${apiBaseUrl}/api/match`;

/**
 * Get all matches for a user
 */
export const getUserMatches = async (userId: string): Promise<DatabaseMatch[]> => {
  const res = await fetch(`${MATCH_BASE_API}/getUserMatches/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user matches');
  return res.json();
};

/**
 * Get a specific match by ID
 */
export const getMatch = async (matchId: string): Promise<DatabaseMatch> => {
  const res = await fetch(`${MATCH_BASE_API}/getMatch/${matchId}`);
  if (!res.ok) throw new Error('Failed to fetch match');
  return res.json();
};

/**
 * Create a new match request
 */
export const createMatch = async (matchData: Match): Promise<DatabaseMatch> => {
  const res = await fetch(`${MATCH_BASE_API}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matchData),
  });
  if (!res.ok) throw new Error('Failed to create match');
  return res.json();
};

/**
 * Delete a match
 */
export const deleteMatch = async (matchId: string, userId: string): Promise<void> => {
  const res = await fetch(`${MATCH_BASE_API}/delete/${matchId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to delete match');
};

/**
 * Generate a match's compability score
 */
export const generateMatchesForUsers = async (
  userId: string,
): Promise<{ matches: DatabaseMatch[]; message: string }> => {
  const res = await fetch(`${MATCH_BASE_API}/generate/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to generate match');

  return res.json();
};

export const getRecommendations = async (userId: string) => {
  const res = await fetch(`${MATCH_BASE_API}/recommend/${userId}`);

  if (!res.ok) throw new Error('Failed to load recommendations');

  return res.json(); // { recommendations, message }
};
