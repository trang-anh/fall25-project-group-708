import { useState } from 'react';
import { OnboardingFormData } from '../types/onboardingFormData';

/**
 * Hook for managing the multi-step match onboarding form.
 * Tracks step progress, form data, validation, and final submission.
 */
const useMatchOnboarding = (onComplete: (data: OnboardingFormData) => Promise<void>) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All onboarding form fields stored in one object
  const [formData, setFormData] = useState<OnboardingFormData>({
    age: 18,
    gender: '',
    location: '',
    programmingLanguage: [],
    level: 'BEGINNER',
    preferences: {
      preferredLanguages: [],
      preferredLevel: 'ALL',
    },
    onboardingAnswers: {
      goals: '',
      personality: '',
      projectType: '',
    },
    biography: '',
  });

  const totalSteps = 5;

  // update top-level fields (age, gender, level, etc.)
  const updateFormData = <K extends keyof OnboardingFormData>(
    field: K,
    value: OnboardingFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // generic type that lets us update nested objects
  type NestedKeys = {
    [K in keyof OnboardingFormData]: OnboardingFormData[K] extends object ? K : never;
  }[keyof OnboardingFormData];

  // update fields inside preferences/onboardingAnswers
  const updateNestedField = <P extends NestedKeys, K extends keyof OnboardingFormData[P]>(
    parent: P,
    field: K,
    value: OnboardingFormData[P][K],
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  /**
   * toggleLanguage
   * - if `isPreference === false` -> updates programmingLanguage list
   * - if `isPreference === true` -> updates preferredLanguages list
   */
  const toggleLanguage = (language: string, isPreference = false) => {
    if (isPreference) {
      setFormData(prev => {
        const curr = prev.preferences.preferredLanguages;
        const updated = curr.includes(language)
          ? curr.filter(l => l !== language)
          : [...curr, language];

        return {
          ...prev,
          preferences: { ...prev.preferences, preferredLanguages: updated },
        };
      });
    } else {
      setFormData(prev => {
        const curr = prev.programmingLanguage;
        const updated = curr.includes(language)
          ? curr.filter(l => l !== language)
          : [...curr, language];

        return { ...prev, programmingLanguage: updated };
      });
    }
  };

  // simple validation per step
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.age >= 13 && formData.gender && formData.location;
      case 2:
        return formData.programmingLanguage.length > 0 && formData.level;
      case 3:
        return formData.preferences.preferredLanguages.length > 0;
      case 4:
        return (
          formData.onboardingAnswers.goals &&
          formData.onboardingAnswers.personality &&
          formData.onboardingAnswers.projectType
        );
      case 5:
        return formData.biography.length >= 50;
      default:
        return false;
    }
  };

  /**
   * Move to the next step if requirements are met.
   */
  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Move back one step.
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /**
   * Final submit — calls the onComplete callback.
   */
  const handleSubmit = async () => {
    if (!canProceed()) return;
    setIsSubmitting(true);

    try {
      await onComplete(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    isSubmitting,
    totalSteps,
    updateFormData,
    updateNestedField,
    toggleLanguage,
    canProceed,
    handleNext,
    handleBack,
    handleSubmit,
  };
};

export default useMatchOnboarding;
