import UserModel, { UserDocument } from '../models/users.model';
import { SafeDatabaseUser } from '../types/types';
import path from 'path';
import fs from 'fs';

/**
 * Helper function to convert UserDocument to SafeDatabaseUser
 */
const toSafeDatabaseUser = (user: UserDocument): SafeDatabaseUser => {
  return {
    _id: user._id,
    username: user.username,
    dateJoined: user.dateJoined,
    biography: user.biography,
    githubId: user.githubId,
    totalPoints: user.totalPoints,
    avatarUrl: user.avatarUrl,
  };
};

export const uploadAvatarService = async (
  username: string,
  file: Express.Multer.File,
): Promise<{ avatarUrl: string; user: SafeDatabaseUser }> => {
  // Store only the URL path, not the filesystem path
  const avatarUrl = `/uploads/avatar/${file.filename}`;

  const existingUser: UserDocument | null = await UserModel.findOne({ username });

  if (!existingUser) {
    const uploadedFilePath = file.path;
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
    throw new Error('User not found');
  }

  const oldAvatarUrl = existingUser.avatarUrl || '';

  existingUser.avatarUrl = avatarUrl;
  await existingUser.save();

  // Delete old avatar file if it exists
  if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
    const oldPath = path.join(process.cwd(), oldAvatarUrl);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (error) {
        // Failed to delete old avatar - not critical, continue anyway
        // The new avatar is already saved successfully
      }
    }
  }

  return {
    avatarUrl,
    user: toSafeDatabaseUser(existingUser),
  };
};

export const deleteAvatarService = async (username: string): Promise<SafeDatabaseUser> => {
  const user: UserDocument | null = await UserModel.findOne({ username });

  if (!user) {
    throw new Error('User not found');
  }

  const avatarUrl = user.avatarUrl;
  if (avatarUrl) {
    const avatarPath = path.join(process.cwd(), avatarUrl);
    if (fs.existsSync(avatarPath)) {
      try {
        fs.unlinkSync(avatarPath);
      } catch (error) {
        // Failed to delete avatar file - not critical
        // Continue to clear the avatarUrl from database anyway
      }
    }
  }

  user.avatarUrl = '';
  await user.save();

  return toSafeDatabaseUser(user);
};
