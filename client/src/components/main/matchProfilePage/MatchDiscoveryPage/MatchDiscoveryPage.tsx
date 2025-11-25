import React from 'react';
import './MatchDiscovery/MatchDiscovery.css';
import { useNavigate } from 'react-router-dom';
import MatchDiscovery from './MatchDiscovery';
import useMatchDiscoveryPage from '../../../../hooks/useMatchDiscoveryPage';

/**
 * Page wrapper for Match Discovery.
 * Handles auth + onboarding checks before showing the discovery content.
 */
const MatchDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, checking, hasProfile } = useMatchDiscoveryPage();

  // Show loading while checking
  if (checking) {
    return (
      <div className='match-discovery-loading'>
        <div className='spinner'></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user || !user._id) {
    return (
      <div className='match-discovery-auth-required'>
        <div className='auth-prompt'>
          <div className='auth-icon'>🔒</div>
          <h2>Authentication Required</h2>
          <p>Please log in to discover coding partners</p>
          <button onClick={() => navigate('/')} className='back-btn'>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Only render discovery page if user has profile
  if (!hasProfile) {
    return null; // Should never reach here due to redirect
  }

  return <MatchDiscovery currentUserId={user._id.toString()} />;
};

export default MatchDiscoveryPage;
