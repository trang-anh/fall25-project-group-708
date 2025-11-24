import React, { useState } from 'react';
import { useMatchDiscovery, useUserMatches } from '../../../hooks/useMatchProfilePage';
import MatchProfileCard from './MatchProfileCard';
import './MatchDiscovery.css';

interface MatchDiscoveryProps {
  currentUserId: string;
}

const MatchDiscovery: React.FC<MatchDiscoveryProps> = ({ currentUserId }) => {
  const { profiles, refetch } = useMatchDiscovery(currentUserId);
  // currentUserProfile, loading, error
  const { matches } = useUserMatches(currentUserId);
  // sendMatchRequest
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
      const hasLanguage = profile.programmingLanguage.some(
        (lang: string) => lang === selectedLanguage,
      );
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
