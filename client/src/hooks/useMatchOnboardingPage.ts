import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from './useUserContext';
import { checkOnboardingStatus, createMatchProfile } from '../services/matchProfileService';
import { MatchProfile } from '@fake-stack-overflow/shared';
import { OnboardingFormData } from '../types/onboardingFormData';
import { generateMatchRecommendation } from '../services/matchService';

/**
 * Hook for the match onboarding page.
 * Checks if the user already has a match profile, and handles creating one
 * when onboarding is completed.
 */
const useMatchOnboardingPage = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    let isMounted = true;

    /**
     * Checks if the current user already completed onboarding.
     * If yes, redirect to discovery page.
     */
    const checkStatus = async () => {
      if (!user || !user._id) {
        if (isMounted) setCheckingStatus(false);
        return;
      }

      try {
        const status = await checkOnboardingStatus(user._id.toString());

        if (status?.exists) {
          navigate('/match-discovery', { replace: true });
          return;
        }

        if (isMounted) setCheckingStatus(false);
      } catch (err) {
        if (isMounted) setCheckingStatus(false);
      }
    };

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  /**
   * Called when the onboarding form finishes.
   * Creates the user's match profile and triggers first-time recommendations.
   */
  const handleOnboardingComplete = async (formData: OnboardingFormData) => {
    if (!user?._id) {
      setError('User not authenticated. Please log in and try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const profileData: MatchProfile = {
        userId: user._id.toString(), // fix here
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
        onboardingAnswers: { ...formData.onboardingAnswers },
        biography: formData.biography,
        profileImageUrl: user.avatarUrl ?? '',
      };

      await createMatchProfile(profileData);

      await generateMatchRecommendation(user._id.toString());

      navigate('/match-discovery', {
        state: {
          message: 'Welcome! Your profile has been created. Start discovering coding partners!',
          showSuccess: true,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  /** Skip onboarding and leave the page */
  const handleSkip = () => navigate('/');

  return {
    user,
    error,
    setError,
    isSubmitting,
    checkingStatus,
    handleOnboardingComplete,
    handleSkip,
  };
};

export default useMatchOnboardingPage;
