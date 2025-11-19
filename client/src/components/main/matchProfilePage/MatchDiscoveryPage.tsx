import React from 'react';
import useUserContext from '../../../hooks/useUserContext';
import MatchDiscovery from './MatchDiscovery';

/**
 * Wrapper component for MatchDiscovery that provides user context
 * Place this in: src/components/main/matching/MatchDiscoveryPage.tsx
 */
const MatchDiscoveryPage: React.FC = () => {
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
        <p>Please log in to discover coding partners</p>
      </div>
    );
  }

  return <MatchDiscovery currentUserId={user._id.toString()} />;
};

export default MatchDiscoveryPage;
