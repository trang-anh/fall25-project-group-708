import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';
import MatchOnboarding from './MatchOnboarding';
import { createMatchProfile, checkOnboardingStatus } from '../../../services/matchProfileService';
import { MatchProfile } from '@fake-stack-overflow/shared';

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

const MatchOnboardingPage: React.FC = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (!user || !user._id) {
        if (isMounted) setCheckingStatus(false);
        return;
      }

      try {
        const status = await checkOnboardingStatus(user._id.toString());

        // If user already has a profile, redirect to discovery
        if (status && status.exists) {
          navigate('/match-discovery', { replace: true });
          return;
        }

        // User not onboarded - show the onboarding form
        if (isMounted) {
          setCheckingStatus(false);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        // On error, still show the form to allow retry
        if (isMounted) {
          setCheckingStatus(false);
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  const handleOnboardingComplete = async (formData: OnboardingFormData) => {
    if (!user?._id) {
      setError('User not authenticated. Please log in and try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const profileData: MatchProfile = {
        userId: user._id,
        isActive: true,
        age: formData.age,
        gender: formData.gender,
        location: formData.location,
        // Convert string[] to ProgrammingLanguage[] objects with name property
        programmingLanguage: formData.programmingLanguage.map(lang => ({ name: lang })),
        level: formData.level,
        preferences: {
          // Convert preferredLanguages string[] to ProgrammingLanguage[] objects
          preferredLanguages: formData.preferences.preferredLanguages.map(lang => ({ name: lang })),
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
          showSuccess: true,
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
    navigate('/');
  };

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
