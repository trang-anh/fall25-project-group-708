import React from 'react';
import './UserMatches.css';
import useUserMatchesList from '../../../hooks/useUserMatchesList';

interface UserMatchesProps {
  currentUserId: string;
}
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

const UserMatches: React.FC<UserMatchesProps> = ({ currentUserId }) => {
  const {
    matches,
    filteredMatches,
    filterStatus,
    setFilterStatus,
    loading,
    error,
    refetch,
    handleDeleteMatch,
    handleAcceptMatch,
    handleDeclineMatch,
  } = useUserMatchesList(currentUserId);

  if (loading) {
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
                        {(otherProfile?.username ?? '??').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className='match-info'>
                    <div className='info-header'>
                      <h3>{otherProfile ? `${otherProfile.username}` : 'Unknown User'}</h3>
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
                        {match.score > 0 && (
                          <div className='detail-row'>
                            <span className='detail-label'>Compatibility:</span>
                            <span className='detail-value'>{(match.score * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {Array.isArray(otherProfile?.programmingLanguage) &&
                      otherProfile.programmingLanguage
                        .slice(0, 4)
                        .map((lang: string, idx: number) => (
                          <span key={idx} className='lang-badge'>
                            {lang}
                          </span>
                        ))}

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
                      <button
                        className='action-btn accept-btn'
                        onClick={() => handleAcceptMatch(match._id)}>
                        Accept
                      </button>
                      <button
                        className='action-btn decline-btn'
                        onClick={() => handleDeclineMatch(match._id)}>
                        Decline
                      </button>
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
