import React from 'react';
import { useUserMatches, MatchProfileWithScore } from '../../../hooks/useMatchProfilePage';
import MatchProfileCard from './MatchProfileCard';
import './MatchDiscovery.css';
import useMatchDiscovery from '../../../hooks/useMatchDiscovery';
import useMatchRecommendation from '../../../hooks/useMatchRecommendation';

interface MatchDiscoveryProps {
  currentUserId: string;
}

const MatchDiscovery: React.FC<MatchDiscoveryProps> = ({ currentUserId }) => {
  const {
    filteredProfiles,
    selectedLevel,
    selectedLanguage,
    searchQuery,
    setSelectedLevel,
    setSelectedLanguage,
    setSearchQuery,
    loading,
    error,
    refetch,
  } = useMatchDiscovery(currentUserId);

  const { matches, sendMatchRequest } = useUserMatches(currentUserId);
  const {
    recommended,
    loading: recLoading,
    error: recError,
  } = useMatchRecommendation(currentUserId);

  // eslint-disable-next-line no-console
  console.log('RECOMMENDED:', recommended);
  // eslint-disable-next-line no-console
  console.log('REC ERROR:', recError);
  // eslint-disable-next-line no-console
  console.log('REC LOADING:', recLoading);

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
            <span className='stat-value'>{filteredProfiles.length}</span>
            <span className='stat-label'>Available</span>
          </div>
          <div className='stat'>
            <span className='stat-value'>{matches.length}</span>
            <span className='stat-label'>Matches</span>
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
            {recommended.map((profile: MatchProfileWithScore) => (
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

      <div className='discovery-filters'>
        <input
          type='text'
          placeholder='Search by bio or location...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='search-input'
        />

        <select
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value)}
          className='filter-select'>
          <option value='ALL'>All Levels</option>
          <option value='BEGINNER'>Beginner</option>
          <option value='INTERMEDIATE'>Intermediate</option>
          <option value='ADVANCED'>Advanced</option>
        </select>

        <select
          value={selectedLanguage}
          onChange={e => setSelectedLanguage(e.target.value)}
          className='filter-select'>
          <option value='ALL'>All Languages</option>
          {/* Add language options dynamically based on available languages */}
        </select>

        <button onClick={refetch} className='refresh-btn'>
          <span className='refresh-icon'>↻</span>
          Refresh
        </button>
      </div>

      {filteredProfiles.length === 0 ? (
        <div className='no-profiles'>
          <p>No profiles match your filters. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className='profiles-grid'>
          {filteredProfiles.map((profile: MatchProfileWithScore) => (
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
    </div>
  );
};

export default MatchDiscovery;
