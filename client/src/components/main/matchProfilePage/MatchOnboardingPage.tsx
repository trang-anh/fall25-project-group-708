import React from 'react';
import './MatchOnboarding.css';
import { useNavigate } from 'react-router-dom';
import MatchOnboarding from './MatchOnboarding';
import useMatchOnboardingPage from '../../../hooks/useMatchOnboardingPage';

/**
 * Page wrapper for the Match Onboarding flow.
 * Handles auth checks, onboarding status checks, and displaying the form.
 */
const MatchOnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    user,
    error,
    setError,
    isSubmitting,
    checkingStatus,
    handleOnboardingComplete,
    handleSkip,
  } = useMatchOnboardingPage();

  // Show authentication required if not logged in
  if (!user || !user._id) {
    return (
      <div className='onboarding-auth-required'>
        <div className='auth-prompt'>
          <div className='auth-icon'>🔒</div>
          <h2>Authentication Required</h2>
          <p>You need to be logged in to set up your match profile</p>
          <button onClick={() => navigate('/')} className='back-btn'>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading while checking status
  if (checkingStatus) {
    return (
      <div className='loading-overlay'>
        <div className='loading-spinner'></div>
        <p>Checking match onboarding status...</p>
      </div>
    );
  }

  // Show the onboarding form
  return (
    <>
      <MatchOnboarding
        currentUserId={user._id.toString()}
        onComplete={handleOnboardingComplete}
        onSkip={handleSkip}
      />

      {error && (
        <div className='error-toast'>
          <div className='toast-icon'>⚠️</div>
          <div className='toast-content'>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button className='toast-close' onClick={() => setError(null)} aria-label='Close'>
            ×
          </button>
        </div>
      )}

      {isSubmitting && (
        <div className='loading-overlay'>
          <div className='loading-spinner'></div>
          <p>Creating your profile...</p>
        </div>
      )}
    </>
  );
};

export default MatchOnboardingPage;
