import UserModel from '../models/users.model';
import { UserResponse } from '../types/types';
import sendTwoFactorCodeEmail from './email.service';

/**
 * Generate a random 6-digit verification code
 */
export const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate and store a 2FA code for the user
 */
export const generate2FACode = async (
  username: string,
  email?: string,
): Promise<{ code: string } | { error: string }> => {
  try {
    const user = await UserModel.findOne({ username });
    if (!user) return { error: 'User not found' };

    const code = generateCode();

    if (email) {
      user.email = email.trim().toLowerCase();
    } else if (!user.email && user.username.includes('@')) {
      user.email = user.username;
    }

    if (!user.email) {
      return { error: 'Email is required to send the verification code' };
    }

    user.twoFactorCode = code;
    await user.save();

    await sendTwoFactorCodeEmail(user.email, code);

    return { code };
  } catch (error) {
    return { error: `Error generating 2FA code: ${error}` };
  }
};

/**
 * Verify the 2FA code and enable 2FA
 */
export const verifyAndEnable2FA = async (username: string, code: string): Promise<UserResponse> => {
  try {
    const user = await UserModel.findOne({ username });
    if (!user) return { error: 'User not found' };

    if (user.twoFactorCode !== code) {
      return { error: 'Invalid verification code' };
    }

    user.twoFactorEnabled = true;
    user.twoFactorCode = null;
    await user.save();

    return user;
  } catch (error) {
    return { error: `Error enabling 2FA: ${error}` };
  }
};

/**
 * Disable 2FA for a user
 */
export const disable2FA = async (username: string): Promise<UserResponse> => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { username },
      { twoFactorEnabled: false, twoFactorCode: null },
      { new: true },
    );

    if (!user) return { error: 'User not found' };
    return user;
  } catch (error) {
    return { error: `Error disabling 2FA: ${error}` };
  }
};

/**
 * Check if 2FA is enabled
 */
export const is2FAEnabled = async (username: string): Promise<boolean> => {
  const user = await UserModel.findOne({ username }).select('twoFactorEnabled');
  return !!user?.twoFactorEnabled;
};

/**
 * Verify 2FA during login
 */
export const verify2FACode = async (username: string, code: string): Promise<boolean> => {
  const user = await UserModel.findOne({ username });
  if (!user || !user.twoFactorEnabled) return false;
  return user.twoFactorCode === code;
};
