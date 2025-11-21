import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';
import MatchDiscovery from './MatchDiscovery';
import { checkOnboardingStatus } from '../../../services/matchProfileService';

const MatchDiscoveryPage: React.FC = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user?._id) {
        setChecking(false);
        return;
      }

      try {
        const status = await checkOnboardingStatus(user._id.toString());

        if (!status.exists) {
          // No profile exists - redirect to opt-in page
          navigate('/match-opt-in', { replace: true });
          return;
        }

        setHasProfile(true);
        setChecking(false);
      } catch (err) {
        // On error, assume no profile and redirect to opt-in
        navigate('/match-opt-in', { replace: true });
      }
    };

    checkProfile();
  }, [user, navigate]);

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
