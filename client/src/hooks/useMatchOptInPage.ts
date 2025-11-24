import { useNavigate } from 'react-router-dom';
import useUserContext from './useUserContext';

const useMatchOptIn = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();

  const handleJoinClick = () => navigate('/match-onboarding');
  const handleMaybeLaterClick = () => navigate('/');

  return {
    user,
    handleJoinClick,
    handleMaybeLaterClick,
  };
};

export default useMatchOptIn;
