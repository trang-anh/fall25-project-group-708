import { useCallback, useEffect, useState } from 'react';
import { DatabaseMatchProfile } from '@fake-stack-overflow/shared';
import {
  getMatchProfile,
  toggleMatchProfileActive,
  updateMatchProfile,
} from '../services/matchProfileService';
import { EditableMatchProfile } from '../types/EditableMatchProfile';
import { useNavigate } from 'react-router-dom';

/**
 * Convert DatabaseMatchProfile -> EditableMatchProfile
 */
const convertToEditable = (p: DatabaseMatchProfile): EditableMatchProfile => ({
  isActive: p.isActive ?? true,
  age: p.age,
  gender: p.gender,
  location: p.location,
  programmingLanguage: p.programmingLanguage ?? [],
  level: p.level,

  preferences: {
    preferredLanguages: p.preferences?.preferredLanguages ?? [],
    preferredLevel: p.preferences?.preferredLevel ?? '',
  },

  onboardingAnswers: {
    goals: p.onboardingAnswers?.goals ?? '',
    personality: p.onboardingAnswers?.personality ?? '',
    projectType: p.onboardingAnswers?.projectType ?? '',
  },

  biography: p.biography ?? '',
});

/**
 * Hook for editing a user's match profile.
 * Handles fetching the profile, updating it, and toggling active status.
 */
const useMatchEditProfilePage = (userId: string | null) => {
  const [profile, setProfile] = useState<DatabaseMatchProfile | null>(null);
  const [formData, setFormData] = useState<EditableMatchProfile | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [successEdit, setSuccessEdit] = useState(false); // edit success
  const [successToggle, setSuccessToggle] = useState(false); // activate/deactivate success

  const [messageToggle, setMessageToggle] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState<boolean>(false);

  const navigate = useNavigate();

  /**
   * Loads the user's match profile from the backend.
   */
  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getMatchProfile(userId);
      setProfile(data);
      setFormData(convertToEditable(data));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Update one field in the form
   */
  const handleSetField = <K extends keyof EditableMatchProfile>(
    field: K,
    value: EditableMatchProfile[K],
  ) => {
    setFormData(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  /**
   * Save formData back into a MatchProfile update object.
   */
  const handleSaveChanges = async () => {
    if (!userId || !formData) return;

    setLoading(true);
    setError(null);

    try {
      const updated = await updateMatchProfile(userId, formData);
      setProfile(updated);

      // success message + redirect
      setSuccessEdit(true);
      setTimeout(() => navigate('/match'), 3000);

      return updated;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle Language
   */
  const handleToggleLanguage = (lang: string) => {
    if (!formData) return;

    const set = new Set(formData.programmingLanguage);

    if (set.has(lang)) {
      set.delete(lang);
    } else {
      set.add(lang);
    }

    handleSetField('programmingLanguage', Array.from(set));
  };

  /**
   * Open confirmation modal
   */
  const requestDeactivate = () => setShowDeactivateModal(true);

  /**
   * Close confirmation modal
   */
  const cancelDeactivate = () => setShowDeactivateModal(false);

  /**
   * Confirm deactivation
   */
  const confirmDeactivate = async () => {
    setShowDeactivateModal(false);
    const updated = await handleToggleActive(); // ← YOU WANTED THIS

    if (updated) {
      setSuccessToggle(true);
      setMessageToggle('Your profile has been deactivated and removed from recommendations.');
      setTimeout(() => navigate('/match-discovery'), 2000);
    }
  };

  /**
   * Toggles whether the match profile is active or hidden.
   * @param isActive - true to activate, false to deactivate
   */
  const handleToggleActive = async () => {
    if (!userId || !profile) return;

    setLoading(true);
    setError(null);
    const newState = !profile.isActive;

    try {
      const updatedProfile = await toggleMatchProfileActive(userId, newState);

      setProfile(updatedProfile);
      setFormData(convertToEditable(updatedProfile));

      setSuccessToggle(true);

      if (newState === false) {
        setMessageToggle('Your profile has been deactivated and removed from recommendations.');
        setTimeout(() => navigate('/match-discovery'), 2000);
      } else {
        setMessageToggle('Your profile has been reactivated!');
        setTimeout(() => navigate('/match'), 2000);
      }

      return updatedProfile;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    formData,

    handleSaveChanges,
    handleSetField,
    handleToggleLanguage,
    handleToggleActive,

    // modal stuff
    showDeactivateModal,
    requestDeactivate,
    cancelDeactivate,
    confirmDeactivate,

    // statuses
    successEdit,
    successToggle,
    messageToggle,

    loading,
    error,
    refetch: fetchProfile,
  };
};

export default useMatchEditProfilePage;
