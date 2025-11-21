import { useState, useEffect, useCallback } from 'react';
// import { getRecommendations } from '../services/matchService';
// import { getMatchProfile } from '../services/matchProfileService';
// import { DatabaseMatch, DatabaseMatchProfile } from '@fake-stack-overflow/shared';
import { MatchProfileWithScore } from './useMatchProfilePage';

// interface BackendRecommendation {
//   userId: string;
//   score: number;
// }

const useMatchRecommendation = (userId: string | null) => {
  const [recommended, setRecommended] = useState<MatchProfileWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommended = useCallback(async () => {
    if (!userId) return;
    setRecommended([]);
    setLoading(true);
    setError(null);

    try {
      // 1. Hit recommendation API
      //   const result = await getRecommendations(userId);
      //   const rawRecs: BackendRecommendation[] = result.recommendations ?? [];
      //   // 2. Populate each recommendation with full profile
      //   const populated = await Promise.all(
      //     rawRecs.map(async rec => {
      //       try {
      //         const profile = await getMatchProfile(rec.userId);
      //         const matchProfile: MatchProfileWithScore = {
      //           ...profile,
      //           compatibilityScore: rec.score ?? 0,
      //         };
      //         return matchProfile;
      //       } catch {
      //         return null; // skip if profile cannot be loaded
      //       }
      //     }),
      //   );
      //   setRecommended(populated.filter((p): p is MatchProfileWithScore => p !== null));
    } catch (err) {
      setError((err as Error).message);
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommended();
  }, [fetchRecommended]);

  return {
    recommended,
    loading,
    error,
    refetch: fetchRecommended,
  };
};

export default useMatchRecommendation;
