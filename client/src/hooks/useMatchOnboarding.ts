import { useState } from 'react';
import { OnboardingFormData } from '../types/onboardingFormData';

const useMatchOnboarding = (onComplete: (data: OnboardingFormData) => Promise<void>) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const updateFormData = <K extends keyof OnboardingFormData>(
    field: K,
    value: OnboardingFormData[K],
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  type NestedKeys = {
    [K in keyof OnboardingFormData]: OnboardingFormData[K] extends object ? K : never;
  }[keyof OnboardingFormData];

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

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

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
