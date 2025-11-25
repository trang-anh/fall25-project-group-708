import React from 'react';
import './MatchProfileCard.css';
import { DatabaseMatch } from '@fake-stack-overflow/shared';
import useMatchProfileCard from '../../../../hooks/useMatchProfileCard';
import { RecommendationProfile } from '../../../../types/recommendationProfile';

/**
 * Props for an individual match profile card.
 * Shows one recommended developer + match status/actions.
 */
interface MatchProfileCardProps {
  profile: RecommendationProfile;
  currentUserId: string;
  matches: DatabaseMatch[];
  sendMatchRequest: (targetUserId: string, score: number) => Promise<DatabaseMatch | undefined>;
}

/**
 * Card component for displaying a recommended user's profile.
 * Handles match state (matched / pending / available) and sends requests.
 */
const MatchProfileCard: React.FC<MatchProfileCardProps> = ({
  profile,
  currentUserId,
  matches,
  sendMatchRequest,
}) => {
  const { alreadyMatched, pendingMatch, handleMatch } = useMatchProfileCard({
    profile,
    currentUserId,
    matches,
    sendMatchRequest,
  });

  // Backend sends numeric score we just display it as percentage
  const displayScore =
    profile.compatibilityScore !== undefined
      ? `${(profile.compatibilityScore * 100).toFixed(1)}%`
      : 'N/A';

  return (
    <div className='match-card'>
      <div className='match-card-header'>
        <h3>{profile.userId.username}</h3>
        <p className='match-bio'>{profile.biography || 'No bio provided'}</p>
      </div>

      <div className='match-card-body'>
        <p>
          <strong>Level:</strong>{' '}
          {profile.level ? profile.level[0] + profile.level.slice(1).toLowerCase() : 'Unknown'}
        </p>
        <p>
          <strong>Languages:</strong> {profile.programmingLanguage.map(l => l).join(', ')}
        </p>

        {profile.compatibilityScore !== undefined && (
          <p className='compatibility-score'>
            <strong>Compatibility Score: </strong> {displayScore}
          </p>
        )}
      </div>

      <div className='match-card-actions'>
        {alreadyMatched ? (
          <button disabled className='matched-btn'>
            Already Matched
          </button>
        ) : pendingMatch ? (
          <button disabled className='pending-btn'>
            Request Sent
          </button>
        ) : (
          <button className='match-btn' onClick={handleMatch}>
            Match
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchProfileCard;
