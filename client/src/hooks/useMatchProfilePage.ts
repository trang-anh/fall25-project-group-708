/**
 * Custom React hooks for managing match profiles and matches
 * Simplified version using backend types directly
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getMatchProfile,
  createMatchProfile,
  updateMatchProfile,
  toggleMatchProfileActive,
  checkOnboardingStatus,
} from '../services/matchProfileService';
import { getUserMatches, createMatch, deleteMatch } from '../services/matchService';
import {
  DatabaseMatchProfile,
  DatabaseMatch,
  MatchProfile,
  CreateMatchDTO,
} from '@fake-stack-overflow/shared';
import { ObjectId } from 'mongodb';

type CreateMatchProfileDTO = Omit<MatchProfile, '_id' | 'createdAt'>;

export interface ProgrammingLanguage {
  name: string;
  proficiency?: string;
}

/**
 * Extended match profile with calculated compatibility score
 */
export interface MatchProfileWithScore {
  _id: string | ObjectId;
  userId: string | ObjectId;

  age?: number;
  gender?: string;

  level: string;
  programmingLanguage: ProgrammingLanguage[];

  biography?: string;
  location?: string;

  preferences?: {
    preferredLanguages?: ProgrammingLanguage[];
    preferredLevel?: string;
  };

  onboardingAnswers?: {
    goals?: string;
    personality?: string;
    projectType?: string;
  };

  isActive?: boolean;
  profileImageUrl?: string;
  createdAt?: Date;

  compatibilityScore: number;
}

/**
 * Hook for managing current user's match profile
 */
export const useMatchProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<DatabaseMatchProfile>();
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

  const createProfile = async (profileData: CreateMatchProfileDTO) => {
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

  const updateProfile = async (updates: Partial<MatchProfile>) => {
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

  // useEffect(() => {
  //   fetchProfile();
  // }, [fetchProfile]);

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
 * Hook for managing user matches
 */
export const useUserMatches = (userId: string | null) => {
  const [matches, setMatches] = useState<DatabaseMatch[]>([]);
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
      const matchData: CreateMatchDTO = {
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
      setMatches(prev => prev.filter((m: DatabaseMatch) => String(m._id) !== matchId));
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
