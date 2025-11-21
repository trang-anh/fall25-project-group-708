import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseMatch, DatabaseMatchProfile } from '@fake-stack-overflow/shared';
import { useUserMatches } from './useMatchProfilePage';
import { getMatchProfile } from '../services/matchProfileService';

export interface PopulatedMatch extends DatabaseMatch {
  otherUserProfile?: DatabaseMatchProfile | null;
}

const useUserMatchesList = (currentUserId: string) => {
  const { matches, loading, error, removeMatch, refetch } = useUserMatches(currentUserId);

  const [populatedMatches, setPopulatedMatches] = useState<PopulatedMatch[]>([]);
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
      const result = await Promise.all(
        matches.map(async match => {
          const otherUserId =
            match.userA.toString() === currentUserId
              ? match.userB.toString()
              : match.userA.toString();

          try {
            const profile = await getMatchProfile(otherUserId);
            return { ...match, otherUserProfile: profile };
          } catch (err) {
            return { ...match, otherUserProfile: null };
          }
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
