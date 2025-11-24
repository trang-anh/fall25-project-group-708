import useMatchRecommendation from './useMatchRecommendation';
import { useMemo } from 'react';
import { useUserMatches } from './useMatchProfilePage';
import { RecommendationProfile } from '../types/recommendationProfile';

/**
 * Hook for getting match recommendations for the current user.
 * Filters out users who are already matched with the current user.
 */
const useMatchDiscovery = (currentUserId: string | null) => {
  const { recommended, loading, error, refetch } = useMatchRecommendation(currentUserId);
  const { matches } = useUserMatches(currentUserId);

  // users already matched
  const matchedUserIds = useMemo(
    () => new Set(matches.flatMap(m => [m.userA.toString(), m.userB.toString()])),
    [matches],
  );

  // Just remove already matched users
  const profiles = useMemo(() => {
    return recommended.filter((p: RecommendationProfile) => {
      const id = p.userId._id.toString();
      return !matchedUserIds.has(id);
    });
  }, [recommended, matchedUserIds]);

  return {
    profiles,
    loading,
    error,
    refetch,
  };
};

export default useMatchDiscovery;
