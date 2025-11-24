import React from 'react';
import { useUserMatches } from '../../../hooks/useMatchProfilePage';
import MatchProfileCard from './MatchProfileCard';
import './MatchDiscovery.css';
import useMatchDiscovery from '../../../hooks/useMatchDiscovery';
import useMatchRecommendation from '../../../hooks/useMatchRecommendation';
import { RecommendationProfile } from '../../../types/recommendationProfile';

/**
 * Props for the MatchDiscovery page.
 * `currentUserId` is the logged-in user's id.
 */
interface MatchDiscoveryProps {
  currentUserId: string;
}

/**
 * Match discovery page.
 * Shows available developers + recommended profiles based on compatibility.
 */
const MatchDiscovery: React.FC<MatchDiscoveryProps> = ({ currentUserId }) => {
  const { profiles, loading, error, refetch } = useMatchDiscovery(currentUserId);

  const { matches, sendMatchRequest } = useUserMatches(currentUserId);
  const {
    recommended,
    loading: recLoading,
    error: recError,
  } = useMatchRecommendation(currentUserId);

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='spinner' />
        <p>Loading profiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='error-state'>
        <p>Error fetching match profiles.</p>
        <p className='error-text'>{error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div className='match-discovery'>
      <header className='discovery-header'>
        <div className='header-content'>
          <h1>Discover Coding Partners</h1>
          <p className='subtitle'>Find developers who share your programming interests</p>
        </div>

        <div className='profile-stats'>
          <div className='stat'>
            <span className='stat-value'>{profiles.length}</span>
            <span className='stat-label'> Available</span>
          </div>
          <div className='stat'>
            <span className='stat-value'>{matches.length}</span>
            <span className='stat-label'> Matches</span>
          </div>
        </div>
      </header>

      <section className='recommended-section'>
        <h2 className='recommended-title'>Recommended For You</h2>

        {recLoading && (
          <div className='loading-container small'>
            <div className='spinner' />
            <p>Analyzing your profile...</p>
          </div>
        )}

        {!recLoading && recError && (
          <p className='error-text small'>Failed to load recommendations.</p>
        )}

        {!recLoading && recommended.length === 0 && !recError && (
          <p className='empty-text'>No recommendations yet.</p>
        )}

        {!recLoading && recommended.length > 0 && (
          <div className='profiles-grid'>
            {recommended.map((profile: RecommendationProfile) => (
              <MatchProfileCard
                key={profile._id.toString()}
                profile={profile}
                matches={matches}
                sendMatchRequest={sendMatchRequest}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MatchDiscovery;
