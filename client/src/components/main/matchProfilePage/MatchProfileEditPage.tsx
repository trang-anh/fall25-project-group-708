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
  } = useMatchEditProfilePage(userId.toString());

  // Static dropdown + checkbox location values
  const locations = [
    'NORTH AMERICA',
    'SOUTH AMERICA',
    'EUROPE',
    'ASIA',
    'AFRICA',
    'AUSTRALIA',
    'ANTARCTICA',
  ];

  // Static dropdown + checkbox programming languages values
  const programmingLanguage = [
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

  if (loading && !profile) {
    return (
      <div className='edit-profile-loading'>
        <div className='spinner'></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return <p className='edit-profile-error'>Error: {error}</p>;
  }

  if (!profile || !formData) {
    return <p>No match profile found.</p>;
  }

  return (
    <div className='edit-profile-container'>
      <h1>Edit Match Profile</h1>
      <p className='subtitle'>Update your preferences and profile information.</p>

      {error && <p className='edit-profile-error'>{error}</p>}

      <div className='edit-form'>
        {/* AGE */}
        <div className='form-group'>
          <label>Age</label>
          <input
            type='number'
            value={formData.age ?? ''}
            onChange={e => handleSetField('age', Number(e.target.value))}
          />
        </div>

        {/* GENDER */}
        <div className='form-group'>
          <label>Gender</label>
          <select
            value={formData.gender || ''}
            onChange={e => handleSetField('gender', e.target.value)}>
            <option value='FEMALE'>Female</option>
            <option value='MALE'>Male</option>
            <option value='NON-BINARY'>Non-binary</option>
            <option value='PREFER TO NOT DESCRIBE'>Prefer to not describe</option>
          </select>
        </div>

        {/* LOCATION */}
        <div className='form-group'>
          <label>Location</label>
          <select
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

        {/* PROGRAMMING LANGUAGES */}
        <div className='form-group'>
          <label>Programming Languages</label>
          <div className='language-checkbox-list'>
            {programmingLanguage.map(lang => (
              <label key={lang} className='checkbox-item'>
                <input
                  type='checkbox'
                  checked={formData.programmingLanguage.includes(lang)}
                  onChange={() => handleToggleLanguage(lang)}
                />
                {lang}
              </label>
            ))}
          </div>
        </div>

        {/* LEVEL */}
        <div className='form-group'>
          <label>Skill Level</label>
          <select value={formData.level} onChange={e => handleSetField('level', e.target.value)}>
            <option value='BEGINNER'>Beginner</option>
            <option value='INTERMEDIATE'>Intermediate</option>
            <option value='ADVANCED'>Advanced</option>
          </select>
        </div>

        {/* BIOGRAPHY */}
        <div className='form-group'>
          <label>Biography</label>
          <textarea
            value={formData.biography || ''}
            onChange={e => handleSetField('biography', e.target.value)}
            rows={4}
          />
        </div>

        {/* ONBOARDING ANSWERS */}
        <div className='form-group'>
          <label>Goals</label>
          <input
            type='text'
            value={formData.onboardingAnswers?.goals ?? ''}
            onChange={e =>
              handleSetField('onboardingAnswers', {
                ...formData.onboardingAnswers,
                goals: e.target.value,
              })
            }
          />
        </div>

        <div className='form-group'>
          <label>Personality</label>
          <input
            type='text'
            value={formData.onboardingAnswers?.personality ?? ''}
            onChange={e =>
              handleSetField('onboardingAnswers', {
                ...formData.onboardingAnswers,
                personality: e.target.value,
              })
            }
          />
        </div>

        <div className='form-group'>
          <label>Preferred Project Type</label>
          <input
            type='text'
            value={formData.onboardingAnswers?.projectType || ''}
            onChange={e =>
              handleSetField('onboardingAnswers', {
                ...formData.onboardingAnswers,
                projectType: e.target.value,
              })
            }
          />
        </div>

        {/* SUCCESS MESSAGES (Edit + Toggle) */}
        {successEdit && (
          <p className='edit-profile-success small-success'>
            Your profile was updated! Redirecting…
          </p>
        )}

        {successToggle && <p className='edit-profile-success small-success'>{messageToggle}</p>}

        {/* SAVE BUTTON */}
        <button className='save-btn' onClick={handleSaveChanges} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        {/* ACTIVATE / DEACTIVATE BUTTON */}
        <button
          className={`toggle-btn ${profile.isActive ? 'active' : 'inactive'}`}
          onClick={profile.isActive ? requestDeactivate : handleToggleActive}
          disabled={loading}>
          {profile.isActive ? 'Deactivate Profile' : 'Reactivate Profile'}
        </button>
      </div>

      {/* CONFIRM MODAL */}
      {showDeactivateModal && (
        <div className='modal-backdrop'>
          <div className='modal'>
            <h3>Deactivate Profile?</h3>
            <p>
              Deactivating your profile will remove you from match recommendations until you
              reactivate it.
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
