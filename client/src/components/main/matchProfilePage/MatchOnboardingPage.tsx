import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';
import MatchOnboarding from './MatchOnboarding';
import { createMatchProfile, checkOnboardingStatus } from '../../../services/matchProfileService';
import { MatchProfile } from '@fake-stack-overflow/shared';

// Define the onboarding form data type
interface OnboardingFormData {
  age: number;
  gender: string;
  location: string;
  programmingLanguage: string[];
  level: string;
  preferences: {
    preferredLanguages: string[];
    preferredLevel: string;
  };
  onboardingAnswers: {
    goals: string;
    personality: string;
    projectType: string;
  };
  biography: string;
}

// Input type for creating match profile (accepts strings for languages)
interface CreateMatchProfileInput {
  userId: string;
  isActive: boolean;
  age: number;
  gender: string;
  location: string;
  programmingLanguage: string[];
  level: string;
  preferences: {
    preferredLanguages: string[];
    preferredLevel: string;
  };
  onboardingAnswers: {
    goals: string;
    personality: string;
    projectType: string;
  };
  biography: string;
  profileImageUrl: string;
}

const MatchOnboardingPage: React.FC = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const handleOnboardingComplete = async (formData: OnboardingFormData) => {
    if (!user?._id) {
      setError('User not authenticated. Please log in and try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare match profile data with correct format
      const profileData: MatchProfile = {
        userId: user._id,
        isActive: true,
        age: formData.age,
        gender: formData.gender,
        location: formData.location,
        programmingLanguage: formData.programmingLanguage,
        level: formData.level,
        preferences: {
          preferredLanguages: formData.preferences.preferredLanguages,
          preferredLevel: formData.preferences.preferredLevel,
        },
        onboardingAnswers: {
          goals: formData.onboardingAnswers.goals,
          personality: formData.onboardingAnswers.personality,
          projectType: formData.onboardingAnswers.projectType,
        },
        biography: formData.biography,
        profileImageUrl: (user as any).avatarUrl || '',
      };

      console.log('Submitting profile data:', profileData);
      await createMatchProfile(profileData);

      navigate('/match-discovery', {
        state: { 
          message: 'Welcome! Your profile has been created. Start discovering coding partners!',
          showSuccess: true 
        },
      });
    } catch (err) {
      console.error('Failed to create match profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/match-opt-in');
  };

  // On mount: check whether the user already has an onboarding/profile.
  React.useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (!user || !user._id) {
        // no user to check yet
        if (isMounted) setCheckingStatus(false);
        return;
      }

      try {
        const status = await checkOnboardingStatus(user._id.toString());

        // If user already has a profile, send them to discovery.
        if (status && status.exists) {
          navigate('/match-discovery', { replace: true });
          return;
        }

        // Not onboarded: send them to the opt-in page so they can start onboarding.
        navigate('/match-opt-in', { replace: true, state: { from: '/match-onboarding' } });
      } catch (err) {
        console.error('Error checking onboarding status', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to check onboarding status');
        }
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  if (!user || !user._id) {
    return (
      <div className="onboarding-auth-required">
        <div className="auth-prompt">
          <div className="auth-icon">🔒</div>
          <h2>Authentication Required</h2>
          <p>You need to be logged in to set up your match profile</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // While we verify onboarding status, show a minimal loading state to avoid flicker.
  if (checkingStatus) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Checking match onboarding status...</p>
      </div>
    );
  }

  return (
    <>
      <MatchOnboarding
        currentUserId={user._id.toString()}
        onComplete={handleOnboardingComplete}
        onSkip={handleSkip}
      />
      
      {error && (
        <div className="error-toast">
          <div className="toast-icon">⚠️</div>
          <div className="toast-content">
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button 
            className="toast-close" 
            onClick={() => setError(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {isSubmitting && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Creating your profile...</p>
        </div>
      )}
    </>
  );
};

export default MatchOnboardingPage;