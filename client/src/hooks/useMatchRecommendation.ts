import { useState, useEffect, useCallback } from 'react';
import { generateMatchRecommendation } from '../services/matchService';
import { RecommendationProfile } from '../types/recommendationProfile';

/**
 * Backend recommendation format before converting into frontend shape.
 */
interface BackendRecommendation {
  userId: string;
  score: number;
  profile: {
    _id: string;
    userId: { _id: string; username: string };
    isActive: boolean;
    age: number;
    gender: string;
    location?: string;
    programmingLanguage: string[];
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    preferences: {
      preferredLanguages: string[];
      preferredLevel: string;
    };
    onboardingAnswers?: {
      goals?: string;
      personality?: string;
      projectType?: string;
    };
    biography: string;
    profileImageUrl?: string;
    createdAt: string;
  };
}

/**
 * Response format returned by generateMatchRecommendation().
 */
interface RecommendationResponse {
  recommendations: BackendRecommendation[];
  message: string;
}

/**
 * Hook for loading match recommendations from the backend.
 * Converts the backend format into a simpler RecommendationProfile[]
 * used by the UI.
 */
const useMatchRecommendation = (userId: string | null) => {
  const [recommended, setRecommended] = useState<RecommendationProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch recommendations and convert them to frontend-friendly objects.
   */
  const fetchRecommended = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // backend already returns full profile + score
      const res: RecommendationResponse = await generateMatchRecommendation(userId);

      // Convert backend recommendation into RecommendationProfile[]
      const converted: RecommendationProfile[] = res.recommendations.map(rec => {
        const raw = rec.profile.userId;

        // normalize userId shape
        const userObj =
          raw && typeof raw === 'object' && '_id' in raw
            ? { _id: String(raw._id), username: String(raw.username ?? 'Unknown User') }
            : { _id: rec.userId, username: 'Unknown User' };

        return {
          _id: userObj._id,
          userId: userObj,
          programmingLanguage: rec.profile.programmingLanguage ?? [],
          level: rec.profile.level,
          biography: rec.profile.biography,
          profileImageUrl: rec.profile.profileImageUrl,
          compatibilityScore: rec.score,
        };
      });

      setRecommended(converted);
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
