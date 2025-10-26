import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useLoginContext from './useLoginContext';
import { getCurrentUser } from '../services/userService';

/**
 * custom hook to check authentication status on app mount.
 * this hook is used to detect if a user is already authenticated
 * 
 * should be called once at the app level, not in individual components.
 */
const useCheckAuth = () => {
  const { setUser } = useLoginContext();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        
        if (user) {
          setUser(user);
          // If user is on login/signup page and already authenticated, redirect to home
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/') {
            navigate('/home');
          }
        }
      } catch (error) {
        // User is not authenticated - this is normal, don't set error
        console.log('No authenticated session found');
        setUser(null);
      }
    };

    checkAuth();
  }, [setUser, navigate]);
};

export default useCheckAuth;