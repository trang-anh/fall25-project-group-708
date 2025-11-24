import { useNavigate } from 'react-router-dom';
import useUserContext from './useUserContext';

/**
 * Hook for the Match Opt-In page.
 * Handles simple navigation for joining onboarding or skipping it.
 */
const useMatchOptIn = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();

  // Go to the onboarding flow
  const handleJoinClick = () => navigate('/match-onboarding');
  // Skip opt-in and return home
  const handleMaybeLaterClick = () => navigate('/');

  return {
    user,
    handleJoinClick,
    handleMaybeLaterClick,
  };
};

export default useMatchOptIn;
