import { useMemo, useCallback } from 'react';
import { DatabaseMatch } from '@fake-stack-overflow/shared';
import { RecommendationProfile } from '../types/recommendationProfile';

/**
 * Params for the match profile card hook.
 * - profile: the recommended user being shown
 * - currentUserId: id of the logged-in user
 * - matches: all existing matches involving the user
 * - sendMatchRequest: function to send a new match request
 */
interface UseMatchProfileCardParams {
  profile: RecommendationProfile;
  currentUserId: string;
  matches: DatabaseMatch[];
  sendMatchRequest: (targetUserId: string, score: number) => Promise<DatabaseMatch | undefined>;
}

/**
 * Hook for a single match profile card.
 * Checks match status with the target user and exposes an action to send a match request.
 */
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
