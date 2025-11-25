import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from './useUserContext';
import { checkOnboardingStatus } from '../services/matchProfileService';

/**
 * Simple hook for the Match Discovery page.
 * Checks if the user has a match profile; if not, redirect to onboarding.
 */
const useMatchDiscoveryPage = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    /**
     * Verifies if the current user has completed onboarding.
     * Redirects to the opt-in page if no profile exists.
     */
    const checkProfile = async () => {
      if (!user?._id) {
        setChecking(false);
        return;
      }

      try {
        const status = await checkOnboardingStatus(user._id.toString());

        if (!status.exists) {
          navigate('/match-opt-in', { replace: true });
          return;
        }

        setHasProfile(true);
        setChecking(false);
      } catch (err) {
        navigate('/match-opt-in', { replace: true });
      }
    };

    checkProfile();
  }, [user, navigate]);

  return {
    user,
    checking,
    hasProfile,
  };
};

export default useMatchDiscoveryPage;
