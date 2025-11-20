import React, { useState } from 'react';
import { useMatchDiscovery, useUserMatches } from '../../../hooks/useMatchProfilePage';
import MatchProfileCard from './MatchProfileCard';
import './MatchDiscovery.css';

interface MatchDiscoveryProps {
  currentUserId: string;
}

const MatchDiscovery: React.FC<MatchDiscoveryProps> = ({ currentUserId }) => {
  const { profiles, currentUserProfile, loading, error, refetch } =
    useMatchDiscovery(currentUserId);
  const { matches, sendMatchRequest } = useUserMatches(currentUserId);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Get existing match user IDs
  const matchedUserIds = new Set(matches.flatMap(m => [m.userA.toString(), m.userB.toString()]));

  // Filter profiles based on selections
  const filteredProfiles = profiles.filter(profile => {
    // Remove already matched users
    if (matchedUserIds.has(profile.userId)) return false;

    // Filter by level
    if (selectedLevel !== 'ALL' && profile.level !== selectedLevel) return false;

    // Filter by language
    if (selectedLanguage !== 'ALL') {
      const hasLanguage = profile.programmingLanguage.some(lang => lang === selectedLanguage);
      if (!hasLanguage) return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesBio = profile.biography?.toLowerCase().includes(query);
      const matchesLocation = profile.location?.toLowerCase().includes(query);
      if (!matchesBio && !matchesLocation) return false;
    }

    return true;
  });

  const handleSendRequest = async (targetUserId: string, score: number) => {
    try {
      await sendMatchRequest(targetUserId, score);
    } catch (err) {
      console.error('Failed to send match request:', err);
    }
  };

  if (loading) {
    return (
      <div className='match-discovery-loading'>
        <div className='spinner'></div>
        <p>Finding your perfect coding partners...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='match-discovery-error'>
        <p>Error loading profiles: {error}</p>
        <button onClick={refetch} className='retry-btn'>
          Retry
        </button>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className='match-discovery-no-profile'>
        <h2>Complete Your Profile First</h2>
        <p>Create your match profile to start discovering coding partners.</p>
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
          {filteredProfiles.map(profile => (
            <MatchProfileCard key={profile._id} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchDiscovery;
