import UserModel, { UserDocument } from '../models/users.model';
import path from 'path';
import fs from 'fs';

export const uploadAvatarService = async (
  username: string,
  file: Express.Multer.File
): Promise<{ avatarUrl: string; user: { username: string; avatarUrl: string } }> => {
  const avatarUrl = `/uploads/avatars/${file.filename}`;

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

  if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
    const oldPath = path.join(__dirname, '../..', oldAvatarUrl);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
      }
    }
  }

  return {
    avatarUrl,
    user: {
      username: existingUser.username,
      avatarUrl: existingUser.avatarUrl || '',
    },
  };
};

export const deleteAvatarService = async (username: string): Promise<void> => {
  const user: UserDocument | null = await UserModel.findOne({ username });

  if (!user) {
    throw new Error('User not found');
  }

  const avatarUrl = user.avatarUrl;
  if (avatarUrl) {
    const avatarPath = path.join(__dirname, '../..', avatarUrl);
    if (fs.existsSync(avatarPath)) {
      try {
        fs.unlinkSync(avatarPath);
      } catch (error) {
        console.error('Failed to delete avatar file:', error);
      }
    }
  }

  user.avatarUrl = '';
  await user.save();
};