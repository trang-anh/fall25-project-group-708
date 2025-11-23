import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserByUsername,
  deleteUser,
  resetPassword,
  updateBiography,
  getTwoFactorStatus,
  requestTwoFactorCode,
  enableTwoFactor,
  disableTwoFactor,
  getActiveSessions,
  revokeSession,
} from '../services/userService';
import { SafeDatabaseUser, UserSessionsResponse } from '../types/types';
import useUserContext from './useUserContext';
import LoginContext from '../contexts/LoginContext';
import { rememberedUserMatches, saveRememberedUser } from '../utils/authStorage';

/**
 * A custom hook to encapsulate all logic/state for the ProfileSettings component.
 */
const useProfileSettings = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useUserContext();
  const loginContextValue = useContext(LoginContext);

  // Local state
  const [userData, setUserData] = useState<SafeDatabaseUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editBioMode, setEditBioMode] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState('');
  const [twoFactorDevCode, setTwoFactorDevCode] = useState<string | null>(null);
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [sessionOverview, setSessionOverview] = useState<UserSessionsResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // For delete-user confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const canEditProfile =
    currentUser.username && userData?.username ? currentUser.username === userData.username : false;

  const fetchSessions = useCallback(async () => {
    if (!canEditProfile) {
      setSessionOverview(null);
      return;
    }

    setSessionsLoading(true);
    try {
      const data = await getActiveSessions();
      setSessionOverview(data);
      setSessionsError(null);
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Failed to load active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }, [canEditProfile]);

  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserByUsername(username);
        setUserData(data);
        setTwoFactorEmail(data.email || '');
      } catch (error) {
        setErrorMessage('Error fetching user profile');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  useEffect(() => {
    if (!username) return;

    const fetchTwoFactorStatus = async () => {
      try {
        const status = await getTwoFactorStatus(username);
        setTwoFactorEnabled(status.twoFactorEnabled);
      } catch {
        setTwoFactorEnabled(false);
      }
    };

    fetchTwoFactorStatus();
  }, [username]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /**
   * Update user data properly for avatar and other profile changes
   * This keeps all user fields intact and updates both local and global state
   */
  const updateUserData = (updatedUser: SafeDatabaseUser) => {
    // Update local userData state (for this profile page)
    setUserData(updatedUser);
    if (updatedUser.email) {
      setTwoFactorEmail(updatedUser.email);
    }

    // If viewing own profile, also update the global currentUser in LoginContext
    if (loginContextValue && currentUser.username === updatedUser.username) {
      loginContextValue.setUser(updatedUser);

      // Optional: Persist to localStorage if you use it
      try {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } catch (error) {
        // Silently fail if localStorage is unavailable
        // Could log to error tracking service in production
      }
    }

    if (rememberedUserMatches(updatedUser.username)) {
      saveRememberedUser(updatedUser);
    }
  };

  /**
   * Toggles the visibility of the password fields.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const beginTwoFactorSetup = async () => {
    if (!username) return;
    const emailForCode = twoFactorEmail.trim();
    if (!emailForCode || !isValidEmail(emailForCode)) {
      setErrorMessage('Enter a valid email address to receive verification codes.');
      setSuccessMessage(null);
      return;
    }

    setIsTwoFactorLoading(true);
    try {
      const response = await requestTwoFactorCode(username, emailForCode);
      setShowTwoFactorSetup(true);
      setTwoFactorCodeInput('');
      setTwoFactorDevCode(response.code ?? null);
      setErrorMessage(null);
      setSuccessMessage('Enter the 6-digit verification code to enable 2FA.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start 2FA setup.');
      setSuccessMessage(null);
    } finally {
      setIsTwoFactorLoading(false);
    }
  };

  const confirmTwoFactorSetup = async () => {
    if (!username) return;
    if (twoFactorCodeInput.length !== 6) {
      setErrorMessage('Enter the 6-digit verification code.');
      return;
    }

    setIsTwoFactorLoading(true);
    try {
      const updatedUser = await enableTwoFactor(username, twoFactorCodeInput);
      updateUserData(updatedUser);
      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setTwoFactorDevCode(null);
      setSuccessMessage('Two-factor authentication enabled.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to enable 2FA.');
      setSuccessMessage(null);
    } finally {
      setIsTwoFactorLoading(false);
    }
  };

  const cancelTwoFactorSetup = () => {
    setShowTwoFactorSetup(false);
    setTwoFactorCodeInput('');
    setTwoFactorDevCode(null);
  };

  const handleDisableTwoFactor = async () => {
    if (!username) return;
    setIsTwoFactorLoading(true);
    try {
      const updatedUser = await disableTwoFactor(username);
      updateUserData(updatedUser);
      setTwoFactorEnabled(false);
      cancelTwoFactorSetup();
      setSuccessMessage('Two-factor authentication disabled.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to disable 2FA.');
      setSuccessMessage(null);
    } finally {
      setIsTwoFactorLoading(false);
    }
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    if (enabled) {
      await beginTwoFactorSetup();
    } else {
      await handleDisableTwoFactor();
    }
  };

  /**
   * Validate the password fields before attempting to reset.
   */
  const validatePasswords = () => {
    if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
      setErrorMessage('Please enter and confirm your new password.');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  /**
   * Handler for resetting the password
   */
  const handleResetPassword = async () => {
    if (!username) return;
    if (!validatePasswords()) {
      return;
    }

    try {
      await resetPassword(username, newPassword);
      setSuccessMessage('Password reset successful!');
      setErrorMessage(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setErrorMessage('Failed to reset password.');
      setSuccessMessage(null);
    }
  };

  const handleUpdateBiography = async () => {
    if (!username) return;

    try {
      // Await the async call to update the biography
      const updatedUser = await updateBiography(username, newBio);

      // Use updateUserData to properly update state
      updateUserData(updatedUser);

      setEditBioMode(false);
      setSuccessMessage('Biography updated!');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to update biography.');
      setSuccessMessage(null);
    }
  };

  /**
   * Handler for deleting the user (triggers confirmation modal)
   */
  const handleDeleteUser = () => {
    if (!username) return;

    setShowConfirmation(true);
    setPendingAction(() => async () => {
      try {
        await deleteUser(username);
        setSuccessMessage(`User "${username}" deleted successfully.`);
        setErrorMessage(null);
        navigate('/');
      } catch (error) {
        setErrorMessage('Failed to delete user.');
        setSuccessMessage(null);
      } finally {
        setShowConfirmation(false);
      }
    });
  };

  const handleViewCollectionsPage = () => {
    navigate(`/collections/${username}`);
    return;
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!canEditProfile) return;

    setRevokingSessionId(sessionId);
    try {
      const result = await revokeSession(sessionId);
      await fetchSessions();

      if (result.currentSessionRevoked) {
        window.location.href = '/login';
      }
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Failed to revoke session.');
    } finally {
      setRevokingSessionId(null);
    }
  };

  return {
    userData,
    newPassword,
    confirmNewPassword,
    setNewPassword,
    setConfirmNewPassword,
    loading,
    editBioMode,
    setEditBioMode,
    newBio,
    setNewBio,
    successMessage,
    errorMessage,
    showConfirmation,
    setShowConfirmation,
    pendingAction,
    setPendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
    handleViewCollectionsPage,
    twoFactorEnabled,
    twoFactorCodeInput,
    setTwoFactorCodeInput,
    twoFactorDevCode,
    isTwoFactorLoading,
    showTwoFactorSetup,
    twoFactorEmail,
    setTwoFactorEmail,
    handleTwoFactorToggle,
    confirmTwoFactorSetup,
    cancelTwoFactorSetup,
    beginTwoFactorSetup,
    updateUserData,
    sessionOverview,
    sessionsLoading,
    sessionsError,
    revokingSessionId,
    handleRevokeSession,
    refreshSessions: fetchSessions,
  };
};

export default useProfileSettings;
