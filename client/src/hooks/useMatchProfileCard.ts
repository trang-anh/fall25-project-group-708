import { useMemo, useCallback } from 'react';
import { MatchProfileWithScore } from './useMatchProfilePage';
import { DatabaseMatch } from '@fake-stack-overflow/shared';

interface UseMatchProfileCardParams {
  profile: MatchProfileWithScore;
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
  const targetId = profile.userId.toString();

  // already matched check
  const alreadyMatched = useMemo(
    () =>
      matches.some(
        m =>
          (m.userA.toString() === currentUserId && m.userB.toString() === targetId) ||
          (m.userB.toString() === currentUserId && m.userA.toString() === targetId),
      ),
    [matches, currentUserId, targetId],
  );

  // pending match check
  const pendingMatch = useMemo(
    () =>
      matches.some(
        m =>
          ((m.userA.toString() === currentUserId && m.userB.toString() === targetId) ||
            (m.userB.toString() === currentUserId && m.userA.toString() === targetId)) &&
          m.status === 'pending',
      ),
    [matches, currentUserId, targetId],
  );

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
