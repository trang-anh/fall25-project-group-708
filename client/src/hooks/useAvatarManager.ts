import * as React from 'react';
import {
  uploadAvatar,
  deleteAvatar,
  validateImageFile,
  getAvatarUrl,
} from '../services/avatarService';

interface UseAvatarManagerProps {
  username?: string;
  currentAvatarUrl?: string;
  onAvatarUpdate: (avatarUrl: string) => void;
}

const useAvatarManager = ({
  username,
  currentAvatarUrl,
  onAvatarUpdate,
}: UseAvatarManagerProps) => {
  const [selectedAvatar, setSelectedAvatar] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const displayAvatar = selectedAvatar || getAvatarUrl(currentAvatarUrl);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid file');
      return;
    }

    setAvatarError('');
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !username) return;

    setAvatarLoading(true);
    setAvatarError('');

    try {
      const result = await uploadAvatar(username, avatarFile);
      onAvatarUpdate(result.avatarUrl);

      // Reset upload state
      setAvatarFile(null);
      setSelectedAvatar(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!username) return;

    if (!window.confirm('Are you sure you want to delete your avatar?')) return;

    setAvatarLoading(true);
    setAvatarError('');

    try {
      await deleteAvatar(username);
      onAvatarUpdate('');
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Failed to delete avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCancelAvatar = () => {
    setSelectedAvatar(null);
    setAvatarFile(null);
    setAvatarError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    selectedAvatar,
    avatarFile,
    avatarLoading,
    avatarError,
    displayAvatar,
    fileInputRef,
    handleAvatarChange,
    handleAvatarClick,
    handleAvatarUpload,
    handleAvatarDelete,
    handleCancelAvatar,
  };
};

export default useAvatarManager;
