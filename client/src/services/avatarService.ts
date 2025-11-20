import axios from 'axios';
import { AvatarUploadResponse, AvatarDeleteResponse } from '@fake-stack-overflow/shared';
import api from './config';

const USER_API_URL = `/api/user`;
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Upload avatar image for a user
 * @param username - The username of the user
 * @param file - The avatar image file
 * @returns Promise with upload response
 * @throws {Error} If an error occurs during the upload process
 */
export const uploadAvatar = async (username: string, file: File): Promise<AvatarUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('username', username);

    const res = await api.post(`${USER_API_URL}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.status !== 200) {
      throw new Error('Error when uploading avatar');
    }

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Error while uploading avatar: ${error.response.data.error || 'Upload failed'}`,
      );
    } else {
      throw new Error('Error while uploading avatar');
    }
  }
};

/**
 * Delete avatar image for a user
 * @param username - The username of the user
 * @returns Promise with deletion response
 * @throws {Error} If an error occurs during the deletion process
 */
export const deleteAvatar = async (username: string): Promise<AvatarDeleteResponse> => {
  try {
    const res = await api.delete(`${USER_API_URL}/avatar`, {
      data: { username },
    });

    if (res.status !== 200) {
      throw new Error('Error when deleting avatar');
    }

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Error while deleting avatar: ${error.response.data.error || 'Deletion failed'}`,
      );
    } else {
      throw new Error('Error while deleting avatar');
    }
  }
};

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Object with validation result
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please select a JPG, PNG, GIF, or WEBP image.',
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB.',
    };
  }

  return { valid: true };
};

/**
 * Get full avatar URL
 * @param avatarUrl - The relative avatar URL from database
 * @returns Full URL to avatar image
 */
export const getAvatarUrl = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;

  // If already a full URL, return as is
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }

  // Otherwise prepend the API base URL
  return `${apiBaseUrl}${avatarUrl}`;
};
