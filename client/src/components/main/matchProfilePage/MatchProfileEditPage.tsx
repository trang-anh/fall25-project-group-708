import React from 'react';
import './MatchProfileEditPage.css';
import useUserContext from '../../../hooks/useUserContext';
import useMatchEditProfilePage from '../../../hooks/useMatchEditProfile';

/**
 * Edit page for a user's match profile.
 * Lets the user update basic info, languages, preferences, and toggle profile active state.
 * Uses a custom hook for fetching + saving profile changes.
 */
const MatchProfileEditPage: React.FC = () => {
  const { user } = useUserContext();
  const userId = user?._id;

  /**
   * Custom hook that loads the profile and exposes form state + handlers.
   */
  const {
    profile,
    formData,
    loading,
    error,
    successEdit,
    successToggle,
    messageToggle,
    handleSetField,
    handleToggleLanguage,
    handleToggleActive,
    handleSaveChanges,
    requestDeactivate,
    cancelDeactivate,
    confirmDeactivate,
    showDeactivateModal,
  } = useMatchEditProfilePage(userId?.toString() || '');

  // Static dropdown values
  const locations = [
    'NORTH AMERICA',
    'SOUTH AMERICA',
    'EUROPE',
    'ASIA',
    'AFRICA',
    'AUSTRALIA',
    'ANTARCTICA',
  ];

  // Static programming languages
  const programmingLanguages = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'Ruby',
    'Go',
    'Rust',
    'Swift',
    'Kotlin',
    'PHP',
    'Scala',
    'R',
    'Dart',
    'SQL',
    'HTML/CSS',
  ];

  // Loading state
  if (loading && !profile) {
    return (
      <div className='edit-profile-page'>
        <div className='edit-profile-container'>
          <div className='edit-profile-loading'>
            <div className='spinner'></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state without profile
  if (error && !profile) {
    return (
      <div className='edit-profile-page'>
        <div className='edit-profile-container'>
          <div className='edit-profile-error'>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No profile found
  if (!profile || !formData) {
    return (
      <div className='edit-profile-page'>
        <div className='edit-profile-container'>
          <div className='edit-profile-error'>
            <p>No match profile found. Please create a profile first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='edit-profile-page'>
      <div className='edit-profile-container'>
        {/* Header */}
        <div className='edit-profile-header'>
          <h1>Edit Match Profile</h1>
          <p className='subtitle'>Update your preferences and profile information</p>
        </div>

        {/* Success/Error Messages */}
        {successEdit && (
          <div className='edit-profile-success'>Profile updated successfully!</div>
        )}

        {successToggle && <div className='edit-profile-success'>{messageToggle}</div>}

        {error && <div className='edit-profile-error'>{error}</div>}

        {/* Form */}
        <form className='edit-form' onSubmit={e => e.preventDefault()}>
          {/* Basic Information Section */}
          <div className='form-section'>
            <div className='form-group'>
              <label htmlFor='age'>Age</label>
              <input
                id='age'
                type='number'
                min='13'
                max='120'
                value={formData.age ?? ''}
                onChange={e => handleSetField('age', Number(e.target.value))}
              />
            </div>

            <div className='form-group'>
              <label htmlFor='gender'>Gender</label>
              <select
                id='gender'
                value={formData.gender || ''}
                onChange={e => handleSetField('gender', e.target.value)}>
                <option value=''>Select gender</option>
                <option value='MALE'>Male</option>
                <option value='FEMALE'>Female</option>
                <option value='NON-BINARY'>Non-binary</option>
                <option value='PREFER NOT TO SAY'>Prefer not to say</option>
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='location'>Location</label>
              <select
                id='location'
                value={formData.location}
                onChange={e => handleSetField('location', e.target.value)}>
                <option value=''>Select your region</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Programming Languages */}
          <div className='form-group'>
            <label>Programming Languages</label>
            <div className='language-checkbox-list'>
              {programmingLanguages.map(lang => (
                <label key={lang} className='checkbox-item'>
                  <input
                    type='checkbox'
                    checked={formData.programmingLanguage.includes(lang)}
                    onChange={() => handleToggleLanguage(lang)}
                  />
                  <span>{lang}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Skill Level */}
          <div className='form-group'>
            <label htmlFor='level'>Skill Level</label>
            <select
              id='level'
              value={formData.level}
              onChange={e => handleSetField('level', e.target.value)}>
              <option value='BEGINNER'>Beginner</option>
              <option value='INTERMEDIATE'>Intermediate</option>
              <option value='ADVANCED'>Advanced</option>
            </select>
          </div>

          {/* Biography */}
          <div className='form-group'>
            <label htmlFor='biography'>Biography</label>
            <textarea
              id='biography'
              value={formData.biography || ''}
              onChange={e => handleSetField('biography', e.target.value)}
              placeholder='Tell us about yourself, your coding interests, and what you are looking for in a partner...'
              rows={6}
            />
          </div>

          {/* Onboarding Answers */}
          <div className='form-group'>
            <label htmlFor='goals'>Coding Goals</label>
            <input
              id='goals'
              type='text'
              value={formData.onboardingAnswers?.goals ?? ''}
              onChange={e =>
                handleSetField('onboardingAnswers', {
                  ...formData.onboardingAnswers,
                  goals: e.target.value,
                })
              }
              placeholder='e.g., Build web applications, contribute to open source...'
            />
          </div>

          <div className='form-group'>
            <label htmlFor='personality'>Coding Style</label>
            <input
              id='personality'
              type='text'
              value={formData.onboardingAnswers?.personality ?? ''}
              onChange={e =>
                handleSetField('onboardingAnswers', {
                  ...formData.onboardingAnswers,
                  personality: e.target.value,
                })
              }
              placeholder='e.g., I love pair programming, prefer working solo...'
            />
          </div>

          <div className='form-group'>
            <label htmlFor='projectType'>Preferred Project Types</label>
            <input
              id='projectType'
              type='text'
              value={formData.onboardingAnswers?.projectType || ''}
              onChange={e =>
                handleSetField('onboardingAnswers', {
                  ...formData.onboardingAnswers,
                  projectType: e.target.value,
                })
              }
              placeholder='e.g., Mobile apps, web development, game dev...'
            />
          </div>

          {/* Action Buttons */}
          <div className='button-group'>
            <button
              type='button'
              className='save-btn'
              onClick={handleSaveChanges}
              disabled={loading}>
              {loading ? (
                <>
                  <div className='button-spinner'></div>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Changes
                </>
              )}
            </button>

            <button
              type='button'
              className={`toggle-btn ${profile.isActive ? 'active' : 'inactive'}`}
              onClick={profile.isActive ? requestDeactivate : handleToggleActive}
              disabled={loading}>
              {profile.isActive ? (
                <>
                  <span>✓</span>
                  Profile Active
                </>
              ) : (
                <>
                  <span>⏸</span>
                  Profile Inactive
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Deactivation Confirmation Modal */}
      {showDeactivateModal && (
        <div className='modal-backdrop'>
          <div className='modal'>
            <h3>Deactivate Profile?</h3>
            <p>
              Deactivating your profile will remove you from match recommendations until you
              reactivate it. Your existing connections will remain intact.
            </p>

            <div className='modal-actions'>
              <button className='modal-cancel' onClick={cancelDeactivate}>
                Cancel
              </button>
              <button className='modal-confirm' onClick={confirmDeactivate}>
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchProfileEditPage;