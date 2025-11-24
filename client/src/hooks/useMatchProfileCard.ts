import { useMemo, useCallback } from 'react';
import { DatabaseMatch } from '@fake-stack-overflow/shared';
import { RecommendationProfile } from '../types/recommendationProfile';

interface UseMatchProfileCardParams {
  profile: RecommendationProfile;
  currentUserId: string;
  matches: DatabaseMatch[];
  sendMatchRequest: (targetUserId: string, score: number) => Promise<DatabaseMatch | undefined>;
}

const useMatchProfileCard = ({
  profile,
  currentUserId,
  matches,
  sendMatchRequest,
}: UseMatchProfileCardParams) => {
  const targetId = profile.userId._id.toString();

  // check if a match exists between the two users
  const matchBetweenUsers = useMemo(
    () =>
      matches.find(
        m =>
          (m.userA.toString() === currentUserId && m.userB.toString() === targetId) ||
          (m.userB.toString() === currentUserId && m.userA.toString() === targetId),
      ),
    [matches, currentUserId, targetId],
  );

  // pending if found + status === pending
  const pendingMatch = matchBetweenUsers?.status === 'pending';

  // fully matched only if found + NOT pending
  const alreadyMatched = matchBetweenUsers !== undefined && matchBetweenUsers.status !== 'pending';

  // send match request
  const handleMatch = useCallback(async () => {
    await sendMatchRequest(targetId, profile.compatibilityScore ?? 0);
  }, [sendMatchRequest, targetId, profile.compatibilityScore]);

  return {
    targetId,
    alreadyMatched,
    pendingMatch,
    handleMatch,
  };
};

export default useMatchProfileCard;
