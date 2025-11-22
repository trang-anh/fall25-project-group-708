import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseMatch, DatabaseMatchProfile } from '@fake-stack-overflow/shared';
import { useUserMatches } from './useMatchProfilePage';
import { getMatchProfile } from '../services/matchProfileService';

export interface PopulatedMatch extends DatabaseMatch {
  otherUserProfile?: DatabaseMatchProfile | null;
}

export interface NormalizedMatchProfile extends Omit<DatabaseMatchProfile, 'userId'> {
  userId: string;
  programmingLanguage: string[];
}

export interface NormalizedMatch
  extends Omit<DatabaseMatch, 'userA' | 'userB' | '_id' | 'initiatedBy'> {
  _id: string;
  userA: string;
  userB: string;
  initiatedBy: string;
  otherUserProfile: NormalizedMatchProfile | null;
}

// Normalize userId into a safe string
function normalizeId(id: unknown): string {
  try {
    // string
    if (typeof id === 'string') return id;

    // direct ObjectId
    if (
      typeof id === 'object' &&
      id !== null &&
      'toHexString' in id &&
      typeof (id as { toHexString: () => string }).toHexString === 'function'
    ) {
      return (id as { toHexString: () => string }).toHexString();
    }

    // embedded { _id: ObjectId }
    if (
      typeof id === 'object' &&
      id !== null &&
      '_id' in id &&
      typeof (id as { _id?: unknown })._id === 'object'
    ) {
      const inner = (id as { _id?: unknown })._id;
      if (
        inner &&
        typeof inner === 'object' &&
        'toHexString' in inner &&
        typeof (inner as { toHexString: () => string }).toHexString === 'function'
      ) {
        return (inner as { toHexString: () => string }).toHexString();
      }
    }

    return String(id);
  } catch {
    return '??';
  }
}

// Normalize profile fields
function normalizeProfile(profile: DatabaseMatchProfile | null): NormalizedMatchProfile | null {
  if (!profile) return null;

  return {
    ...profile,
    userId: normalizeId(profile.userId),
    programmingLanguage: Array.isArray(profile.programmingLanguage)
      ? profile.programmingLanguage
      : [],
  };
}

const useUserMatchesList = (currentUserId: string) => {
  const { matches, loading, error, removeMatch, refetch } = useUserMatches(currentUserId);
  const [populatedMatches, setPopulatedMatches] = useState<NormalizedMatch[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'accepted' | 'pending' | 'rejected'>(
    'all',
  );

  /**
   * Populate matches with the other user's profile
   */
  const populateMatches = useCallback(async () => {
    if (!matches || matches.length === 0) {
      setPopulatedMatches([]);
      return;
    }

    setLoadingProfiles(true);

    try {
      const result: NormalizedMatch[] = await Promise.all(
        matches.map(async match => {
          const otherUserId =
            match.userA.toString() === currentUserId
              ? match.userB.toString()
              : match.userA.toString();

          let rawProfile: DatabaseMatchProfile | null = null;

          try {
            rawProfile = await getMatchProfile(otherUserId);
          } catch {
            rawProfile = null;
          }

          const normalizedOther = normalizeProfile(rawProfile);

          return {
            ...match,
            _id: normalizeId(match._id),
            userA: normalizeId(match.userA),
            userB: normalizeId(match.userB),
            initiatedBy: normalizeId(match.initiatedBy),
            createdAt: match.createdAt ? new Date(match.createdAt) : new Date(),
            otherUserProfile: normalizedOther,
          } as NormalizedMatch;
        }),
      );

      setPopulatedMatches(result);
    } finally {
      setLoadingProfiles(false);
    }
  }, [matches, currentUserId]);

  useEffect(() => {
    populateMatches();
  }, [matches, populateMatches]);

  /**
   * Filter matches (Connected / Pending / Declined)
   */
  const filteredMatches = useMemo(() => {
    if (filterStatus === 'all') return populatedMatches;
    return populatedMatches.filter(m => m.status === filterStatus);
  }, [filterStatus, populatedMatches]);

  /**
   * Handle deleting a match
   */
  const handleDeleteMatch = useCallback(
    async (matchId: string) => {
      if (!window.confirm('Are you sure you want to remove this match?')) return;
      await removeMatch(matchId);
    },
    [removeMatch],
  );

  return {
    matches,
    loading: loading || loadingProfiles,
    error,
    refetch,
    filteredMatches,
    filterStatus,
    setFilterStatus,
    handleDeleteMatch,
  };
};

export default useUserMatchesList;
