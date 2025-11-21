import React, { useState, useEffect } from 'react';
import { useUserMatches } from '../../../hooks/useMatchProfilePage';
import { DatabaseMatch } from '@fake-stack-overflow/shared';
import { getMatchProfile } from '../../../services/matchProfileService';
import './UserMatches.css';

interface UserMatchesProps {
  currentUserId: string;
}

// Extended type to properly represent the full profile data
interface FullMatchProfile {
  _id: string;
  userId: string;
  isActive: boolean;
  age: number;
  gender: string;
  location: string;
  programmingLanguage: string[];
  level: string;
  preferences: {
    preferredLanguages: string[];
    preferredLevel: string;
  };
  onboardingAnswers?: {
    goals?: string;
    personality?: string;
    projectType?: string;
  };
  biography?: string;
  profileImageUrl?: string;
  createdAt: Date;
}

interface PopulatedMatch extends DatabaseMatch {
  otherUserProfile?: FullMatchProfile | null;
}

const UserMatches: React.FC<UserMatchesProps> = ({ currentUserId }) => {
  const { matches, loading, error, removeMatch, refetch } = useUserMatches(currentUserId);
  const [populatedMatches, setPopulatedMatches] = useState<PopulatedMatch[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const populateMatches = async () => {
      if (matches.length === 0) return;

      setLoadingProfiles(true);
      try {
        const populated = await Promise.all(
          matches.map(async match => {
            const otherUserId =
              match.userA.toString() === currentUserId
                ? match.userB.toString()
                : match.userA.toString();

            try {
              const profile = await getMatchProfile(otherUserId);
              return { ...match, otherUserProfile: profile };
            } catch (err) {
              return { ...match, otherUserProfile: null };
            }
          }),
        );
        setPopulatedMatches(populated);
      } catch (err) {
      } finally {
        setLoadingProfiles(false);
      }
    };

    populateMatches();
  }, [matches, currentUserId]);

  const handleDeleteMatch = async (matchId: string) => {
    if (window.confirm('Are you sure you want to remove this match?')) {
      try {
        await removeMatch(matchId);
      } catch (err) {}
    }
  };

  const filteredMatches = populatedMatches.filter(match => {
    if (filterStatus === 'all') return true;
    return match.status === filterStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'status-accepted';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Connected';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Declined';
      default:
        return status;
    }
  };

  if (loading || loadingProfiles) {
    return (
      <div className='user-matches-loading'>
        <div className='spinner'></div>
        <p>Loading your matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='user-matches-error'>
        <p>Error loading matches: {error}</p>
        <button onClick={refetch} className='retry-btn'>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='user-matches'>
      <header className='matches-header'>
        <div className='header-content'>
          <h1>Your Matches</h1>
          <p className='subtitle'>Manage your programming partner connections</p>
        </div>

        <div className='match-stats'>
          <div className='stat'>
            <span className='stat-value'>{matches.length}</span>
            <span className='stat-label'>Total</span>
          </div>
          <div className='stat'>
            <span className='stat-value'>
              {matches.filter(m => m.status === 'accepted').length}
            </span>
            <span className='stat-label'>Active</span>
          </div>
          <div className='stat'>
            <span className='stat-value'>{matches.filter(m => m.status === 'pending').length}</span>
            <span className='stat-label'>Pending</span>
          </div>
        </div>
      </header>

      <div className='matches-filters'>
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}>
          All Matches
        </button>
        <button
          className={`filter-btn ${filterStatus === 'accepted' ? 'active' : ''}`}
          onClick={() => setFilterStatus('accepted')}>
          Connected
        </button>
        <button
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}>
          Pending
        </button>
        <button
          className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilterStatus('rejected')}>
          Declined
        </button>
      </div>

      {filteredMatches.length === 0 ? (
        <div className='no-matches'>
          <h2>No Matches Yet</h2>
          <p>Start discovering coding partners to build your network!</p>
        </div>
      ) : (
        <div className='matches-list'>
          {filteredMatches.map(match => {
            const otherProfile = match.otherUserProfile;
            const initiatedByCurrentUser = match.initiatedBy.toString() === currentUserId;

            return (
              <div key={match._id.toString()} className='match-item'>
                <div className='match-profile'>
                  <div className='profile-avatar'>
                    {otherProfile?.profileImageUrl ? (
                      <img src={otherProfile.profileImageUrl} alt='Profile' />
                    ) : (
                      <div className='avatar-placeholder'>
                        {otherProfile?.userId?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                    )}
                  </div>

                  <div className='match-info'>
                    <div className='info-header'>
                      <h3>
                        {otherProfile
                          ? `User ${otherProfile.userId.substring(0, 8)}`
                          : 'Unknown User'}
                      </h3>
                      <span className={`status-badge ${getStatusBadgeClass(match.status)}`}>
                        {getStatusLabel(match.status)}
                      </span>
                    </div>

                    {otherProfile && (
                      <div className='profile-details'>
                        <div className='detail-row'>
                          <span className='detail-label'>Level:</span>
                          <span className='detail-value'>{otherProfile.level}</span>
                        </div>
                        <div className='detail-row'>
                          <span className='detail-label'>Location:</span>
                          <span className='detail-value'>{otherProfile.location}</span>
                        </div>
                        {match.score > 0 && (
                          <div className='detail-row'>
                            <span className='detail-label'>Compatibility:</span>
                            <span className='detail-value'>{match.score}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {otherProfile?.programmingLanguage && (
                      <div className='match-languages'>
                        {otherProfile.programmingLanguage
                          .slice(0, 4)
                          .map((lang: string, idx: number) => (
                            <span key={idx} className='lang-badge'>
                              {lang}
                            </span>
                          ))}
                      </div>
                    )}

                    <div className='match-meta'>
                      <span className='meta-text'>
                        {initiatedByCurrentUser ? 'You sent request' : 'Received request'}
                      </span>
                      <span className='meta-date'>
                        {new Date(match.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='match-actions'>
                  {match.status === 'pending' && !initiatedByCurrentUser && (
                    <>
                      <button className='action-btn accept-btn'>Accept</button>
                      <button className='action-btn decline-btn'>Decline</button>
                    </>
                  )}

                  {match.status === 'accepted' && (
                    <button className='action-btn message-btn'>Message</button>
                  )}

                  <button
                    onClick={() => handleDeleteMatch(match._id.toString())}
                    className='action-btn remove-btn'>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserMatches;
