import React from 'react';
import { MatchProfileWithScore } from '../../../hooks/useMatchProfilePage';
import './MatchProfileCard.css';
import { DatabaseMatch } from '@fake-stack-overflow/shared';
import useMatchProfileCard from '../../../hooks/useMatchProfileCard';

interface MatchProfileCardProps {
  profile: MatchProfileWithScore;
  currentUserId: string;
  matches: DatabaseMatch[];
  sendMatchRequest: (targetUserId: string, score: number) => Promise<DatabaseMatch | undefined>;
}

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

  return (
    <div className='match-card'>
      <div className='match-card-header'>
        <h3>{profile.biography || 'No bio provided'}</h3>
        <p className='match-location'>{profile.location || 'Unknown location'}</p>
      </div>

      <div className='match-card-body'>
        <p>
          <strong>Level:</strong> {profile.level}
        </p>
        <p>
          <strong>Languages:</strong> {profile.programmingLanguage.map(l => l.name).join(', ')}
        </p>

        {profile.compatibilityScore !== undefined && (
          <p className='compatibility-score'>Compatibility Score: {profile.compatibilityScore}%</p>
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
