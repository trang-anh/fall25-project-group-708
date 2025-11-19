/**
 * Custom React hooks for managing match profiles and matches
 * Simplified version using backend types directly
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMatchProfile,
  getAllMatchProfiles,
  createMatchProfile,
  updateMatchProfile,
  toggleMatchProfileActive,
  checkOnboardingStatus,
  getUserMatches,
  createMatch,
  deleteMatch,
  calculateCompatibilityScore,
} from '../services/matchProfileService';
import {
  DatabaseMatch,
  DatabaseMatchProfile,
  MatchProfile,
  Match,
} from '@fake-stack-overflow/shared';

/**
 * Extended match profile with calculated compatibility score
 */
export interface MatchProfileWithScore extends DatabaseMatchProfile {
  compatibilityScore: number;
}

/**
 * Hook for managing current user's match profile
 */
export const useMatchProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getMatchProfile(userId);
      setProfile(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createProfile = async (profileData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newProfile = await createMatchProfile(profileData);
      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await updateMatchProfile(userId, updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (isActive: boolean) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await toggleMatchProfileActive(userId, isActive);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    createProfile,
    updateProfile,
    toggleActive,
  };
};

/**
 * Hook for discovering and browsing match profiles
 */
export const useMatchDiscovery = (currentUserId: string | null) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allProfiles, userProfile] = await Promise.all([
        getAllMatchProfiles(),
        currentUserId ? getMatchProfile(currentUserId) : Promise.resolve(null),
      ]);

      setCurrentUserProfile(userProfile);

      // Filter out current user and inactive profiles
      const filteredProfiles = allProfiles.filter(
        (p: any) => p.userId !== currentUserId && p.isActive,
      );

      // Calculate compatibility scores if user has profile
      if (userProfile) {
        const profilesWithScores = filteredProfiles.map((p: any) => ({
          ...p,
          compatibilityScore: calculateCompatibilityScore(userProfile, p),
        }));

        // Sort by compatibility score
        profilesWithScores.sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore);
        setProfiles(profilesWithScores);
      } else {
        // Add 0 score to profiles
        const profilesWithZeroScore = filteredProfiles.map((p: any) => ({
          ...p,
          compatibilityScore: 0,
        }));
        setProfiles(profilesWithZeroScore);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    currentUserProfile,
    loading,
    error,
    refetch: fetchProfiles,
  };
};

/**
 * Hook for managing user matches
 */
export const useUserMatches = (userId: string | null) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getUserMatches(userId);
      setMatches(data);
    } catch (err) {
      setError((err as Error).message);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendMatchRequest = async (targetUserId: string, score: number = 0) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const matchData: any = {
        userA: userId,
        userB: targetUserId,
        status: 'pending',
        score,
        initiatedBy: userId,
      };

      const newMatch = await createMatch(matchData);
      setMatches(prev => [...prev, newMatch]);
      return newMatch;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMatch = async (matchId: string) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      await deleteMatch(matchId, userId);
      setMatches(prev => prev.filter((m: any) => String(m._id) !== matchId));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches,
    sendMatchRequest,
    removeMatch,
  };
};

/**
 * Hook for checking onboarding status
 */
export const useOnboardingStatus = (userId: string | null) => {
  const [status, setStatus] = useState<{ exists: boolean; isActive: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await checkOnboardingStatus(userId);
      setStatus(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    refetch: checkStatus,
  };
};
