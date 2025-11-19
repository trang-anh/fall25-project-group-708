import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';
import MatchOnboarding from './MatchOnboarding';
import { createMatchProfile, getMatchProfile } from '../../../services/matchProfileService';

/**
 * Wrapper component for MatchOnboarding that handles user context and navigation
 */
const MatchOnboardingPage: React.FC = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user already has a profile
    const checkExistingProfile = async () => {
      if (!user?._id) return;

      try {
        const profile = await getMatchProfile(user._id.toString());
        if (profile) {
          navigate('/match-discovery');
        }
      } catch (err) {
        // Profile doesn't exist, continue with onboarding
      }
    };

    checkExistingProfile();
  }, [user, navigate]);

  const handleOnboardingComplete = async (formData: any) => {
    if (!user?._id) {
      setError('User not authenticated');
      return;
    }

    try {
      // Prepare the profile data
      const profileData = {
        userId: user._id,
        isActive: true,
        age: formData.age,
        gender: formData.gender,
        location: formData.location,
        programmingLanguage: formData.programmingLanguage,
        level: formData.level,
        preferences: formData.preferences,
        onboardingAnswers: formData.onboardingAnswers,
        biography: formData.biography,
        profileImageUrl: user.avatarUrl || undefined,
      };

      // Create the match profile
      await createMatchProfile(profileData);

      // Navigate to discovery page
      navigate('/match-discovery', {
        state: { message: 'Profile created successfully! Start discovering partners.' },
      });
    } catch (err: any) {
      console.error('Failed to create match profile:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
    }
  };

  const handleSkip = () => {
    // Navigate to main page or show a modal
    navigate('/');
  };

  if (!user || !user._id) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #1a1d29 0%, #252838 100%)',
          color: '#fff',
          textAlign: 'center',
          padding: '2rem',
        }}>
        <div>
          <h2>Please log in to continue</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            You need to be logged in to set up your match profile
          </p>
        </div>
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
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(255, 107, 107, 0.2)',
            border: '1px solid rgba(255, 107, 107, 0.4)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            color: '#ff6b6b',
            maxWidth: '400px',
            zIndex: 1000,
          }}>
          {error}
        </div>
      )}
    </>
  );
};

export default MatchOnboardingPage;
