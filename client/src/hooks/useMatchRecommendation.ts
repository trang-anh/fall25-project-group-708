import { useState, useEffect, useCallback } from 'react';
import { generateMatchRecommendation } from '../services/matchService';
import { RecommendationProfile } from '../types/recommendationProfile';
// import { MatchProfileWithUser } from '@fake-stack-overflow/shared';

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

interface RecommendationResponse {
  recommendations: BackendRecommendation[];
  message: string;
}

// This hook loads match recommendations directly from backend
const useMatchRecommendation = (userId: string | null) => {
  const [recommended, setRecommended] = useState<RecommendationProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommended = useCallback(async () => {
    if (!userId) return;
    // setRecommended([]);
    setLoading(true);
    setError(null);

    try {
      // backend already returns full profile + score
      const res: RecommendationResponse = await generateMatchRecommendation(userId);

      const converted: RecommendationProfile[] = res.recommendations.map(rec => {
        const raw = rec.profile.userId;

        // FORCE shape: {_id: string, username: string}
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
