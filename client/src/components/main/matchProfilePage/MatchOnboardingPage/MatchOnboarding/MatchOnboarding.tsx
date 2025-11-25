import React from 'react';
import './MatchOnboarding.css';
import useMatchOnboarding from '../../../../../hooks/useMatchOnboarding';
import { OnboardingFormData } from '../../../../../types/onboardingFormData';

/**
 * Props for the MatchOnboarding component.
 *
 * @param currentUserId - The ID of the logged-in user.
 * @param onComplete - Callback when form submission is complete.
 * @param onSkip - Optional callback if the user chooses to skip onboarding.
 */
interface MatchOnboardingProps {
  currentUserId: string;
  onComplete: (formData: OnboardingFormData) => Promise<void>;
  onSkip?: () => void;
}

const PROGRAMMING_LANGUAGES = [
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

/**
 * Main onboarding component that walks users through multiple steps
 * to complete their match profile.
 *
 * @component
 * @param props - The component props.
 * @returns The onboarding form UI.
 */
const MatchOnboarding: React.FC<MatchOnboardingProps> = ({ onComplete, onSkip }) => {
  // Extract logic from the hook
  const {
    formData,
    currentStep,
    isSubmitting,
    totalSteps,
    updateFormData,
    updateNestedField,
    toggleLanguage,
    canProceed,
    handleNext,
    handleBack,
    handleSubmit,
  } = useMatchOnboarding(onComplete);

  /**
   * Renders the current step of the onboarding flow.
   * @returns {JSX.Element | null} The step content.
   */
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className='onboarding-step'>
            <div className='step-header'>
              <h2>Tell us about yourself</h2>
              <p>Let's start with some basic information</p>
            </div>

            <div className='form-group'>
              <label htmlFor='age'>Age</label>
              <input
                id='age'
                type='number'
                min='13'
                max='120'
                value={formData.age}
                onChange={e => updateFormData('age', parseInt(e.target.value))}
                className='form-input'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='gender'>Gender</label>
              <select
                id='gender'
                value={formData.gender}
                onChange={e => updateFormData('gender', e.target.value)}
                className='form-select'>
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
                onChange={e => updateFormData('location', e.target.value)}
                className='form-select'>
                <option value=''>Select your region</option>
                <option value='NORTH AMERICA'>North America</option>
                <option value='SOUTH AMERICA'>South America</option>
                <option value='EUROPE'>Europe</option>
                <option value='ASIA'>Asia</option>
                <option value='AFRICA'>Africa</option>
                <option value='AUSTRALIA'>Australia</option>
                <option value='ANTARCTICA'>Antarctica</option>
              </select>
              <span className='helper-text'>Select your general region</span>
            </div>
          </div>
        );

      case 2:
        return (
          <div className='onboarding-step'>
            <div className='step-header'>
              <h2>Your programming expertise</h2>
              <p>Select the languages you know and your skill level</p>
            </div>

            <div className='form-group'>
              <label>Programming Languages (select at least 1)</label>
              <div className='language-grid'>
                {PROGRAMMING_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type='button'
                    className={`language-pill ${
                      formData.programmingLanguage.includes(lang) ? 'selected' : ''
                    }`}
                    onClick={() => toggleLanguage(lang)}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className='form-group'>
              <label>Your Skill Level</label>
              <div className='level-options'>
                <button
                  type='button'
                  className={`level-option ${formData.level === 'BEGINNER' ? 'selected' : ''}`}
                  onClick={() => updateFormData('level', 'BEGINNER')}>
                  <div className='level-icon'>🌱</div>
                  <h3>Beginner</h3>
                  <p>Just starting out or learning the basics</p>
                </button>
                <button
                  type='button'
                  className={`level-option ${formData.level === 'INTERMEDIATE' ? 'selected' : ''}`}
                  onClick={() => updateFormData('level', 'INTERMEDIATE')}>
                  <div className='level-icon'>🚀</div>
                  <h3>Intermediate</h3>
                  <p>Comfortable with core concepts and building projects</p>
                </button>
                <button
                  type='button'
                  className={`level-option ${formData.level === 'ADVANCED' ? 'selected' : ''}`}
                  onClick={() => updateFormData('level', 'ADVANCED')}>
                  <div className='level-icon'>⭐</div>
                  <h3>Advanced</h3>
                  <p>Expert level with years of experience</p>
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className='onboarding-step'>
            <div className='step-header'>
              <h2>Partner preferences</h2>
              <p>What are you looking for in a coding partner?</p>
            </div>

            <div className='form-group'>
              <label>Preferred Languages (select at least 1)</label>
              <div className='language-grid'>
                {PROGRAMMING_LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    type='button'
                    className={`language-pill ${
                      formData.preferences.preferredLanguages.includes(lang) ? 'selected' : ''
                    }`}
                    onClick={() => toggleLanguage(lang, true)}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className='form-group'>
              <label htmlFor='preferredLevel'>Preferred Partner Level</label>
              <select
                id='preferredLevel'
                value={formData.preferences.preferredLevel}
                onChange={e => updateNestedField('preferences', 'preferredLevel', e.target.value)}
                className='form-select'>
                <option value='ALL'>No Preference</option>
                <option value='BEGINNER'>Beginner</option>
                <option value='INTERMEDIATE'>Intermediate</option>
                <option value='ADVANCED'>Advanced</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className='onboarding-step'>
            <div className='step-header'>
              <h2>Let's get to know you better</h2>
              <p>Answer a few questions to help us find your perfect match</p>
            </div>

            <div className='form-group'>
              <label htmlFor='goals'>What are your coding goals?</label>
              <textarea
                id='goals'
                placeholder='e.g., Build web applications, contribute to open source, learn new frameworks...'
                value={formData.onboardingAnswers.goals}
                onChange={e => updateNestedField('onboardingAnswers', 'goals', e.target.value)}
                className='form-textarea'
                rows={4}
              />
            </div>

            <div className='form-group'>
              <label htmlFor='personality'>How would you describe your coding style?</label>
              <textarea
                id='personality'
                placeholder='e.g., I love pair programming, prefer to work solo then review together, enjoy teaching...'
                value={formData.onboardingAnswers.personality}
                onChange={e =>
                  updateNestedField('onboardingAnswers', 'personality', e.target.value)
                }
                className='form-textarea'
                rows={4}
              />
            </div>

            <div className='form-group'>
              <label htmlFor='projectType'>What type of projects interest you?</label>
              <textarea
                id='projectType'
                placeholder='e.g., Mobile apps, web development, game development, data science...'
                value={formData.onboardingAnswers.projectType}
                onChange={e =>
                  updateNestedField('onboardingAnswers', 'projectType', e.target.value)
                }
                className='form-textarea'
                rows={4}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className='onboarding-step'>
            <div className='step-header'>
              <h2>Create your profile bio</h2>
              <p>Tell potential partners about yourself (minimum 50 characters)</p>
            </div>

            <div className='form-group'>
              <label htmlFor='biography'>Your Bio</label>
              <textarea
                id='biography'
                placeholder="Write a brief introduction about yourself, your interests, and what you're looking for in a coding partner..."
                value={formData.biography}
                onChange={e => updateFormData('biography', e.target.value)}
                className='form-textarea bio-textarea'
                rows={8}
              />
              <div className='char-count'>
                {formData.biography.length} / 50 minimum
                {formData.biography.length >= 50 && ' ✓'}
              </div>
            </div>

            <div className='bio-preview'>
              <h4>Preview</h4>
              <div className='preview-card'>
                <p>{formData.biography || 'Your bio will appear here...'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='match-onboarding'>
      <div className='onboarding-container'>
        <div className='onboarding-header'>
          <h1>Welcome to Partner Matching</h1>
          <p className='subtitle'>Let's set up your profile to find the perfect coding partners</p>

          <div className='progress-bar'>
            <div
              className='progress-fill'
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className='step-indicator'>
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        <div className='onboarding-content'>{renderStep()}</div>

        <div className='onboarding-footer'>
          <button
            type='button'
            onClick={handleBack}
            className='btn-secondary'
            disabled={currentStep === 1}>
            Back
          </button>

          {onSkip && currentStep === 1 && (
            <button type='button' onClick={onSkip} className='btn-skip'>
              Skip for now
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type='button'
              onClick={handleNext}
              className='btn-primary'
              disabled={!canProceed()}>
              Next
            </button>
          ) : (
            <button
              type='button'
              onClick={handleSubmit}
              className='btn-primary'
              disabled={!canProceed() || isSubmitting}>
              {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchOnboarding;
