import React from 'react';
import useUserContext from '../../../../hooks/useUserContext';
import UserMatches from './UserMatches/UserMatches';

/**
 * Wrapper component for UserMatches that provides user context
 */
const UserMatchesPage: React.FC = () => {
  const { user } = useUserContext();

  if (!user || !user._id) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#666',
        }}>
        <p>Please log in to view your matches</p>
      </div>
    );
  }

  return <UserMatches currentUserId={user._id.toString()} />;
};

export default UserMatchesPage;
