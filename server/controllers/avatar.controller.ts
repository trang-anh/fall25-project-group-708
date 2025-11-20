import { Response } from 'express';
import {
  AvatarUploadRequest,
  AvatarDeleteRequest,
  AvatarUploadResponse,
  AvatarDeleteResponse,
} from '../types/types';
import { uploadAvatarService, deleteAvatarService } from '../services/avatar.service';

/**
 * Controller for handling avatar upload
 * POST /api/user/avatar
 */
export const uploadAvatar = async (
  req: AvatarUploadRequest,
  res: Response<AvatarUploadResponse | { error: string }>,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { username } = req.body;

    if (!username) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { avatarUrl, user } = await uploadAvatarService(username, req.file);

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

/**
 * Controller for handling avatar deletion
 * DELETE /api/user/avatar
 */
export const deleteAvatar = async (
  req: AvatarDeleteRequest,
  res: Response<AvatarDeleteResponse | { error: string }>,
) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await deleteAvatarService(username);

    res.status(200).json({
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
};
