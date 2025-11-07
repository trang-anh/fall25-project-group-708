import MatchProfileModel from '../models/matchProfiles.model';
import { MatchProfile, MatchProfileResponse, DatabaseMatchProfile } from '../types/types';

/**
 * Creates a new community with the provided data.
 * The admin user is automatically added to the participants list if not already included.
 *
 * @param communityData - Object containing community details including name, description, visibility, admin, and participants
 * @returns A Promise resolving to the newly created community document or an error object
 */
export const createMatchProfile = async (
  matchProfileData: MatchProfile,
): Promise<MatchProfileResponse> => {
  try {
    // Ensure admin is included in the participants list
    const newMatchProfile = new MatchProfileModel({
      userId: matchProfileData.userId,
      isActive: matchProfileData.isActive ?? false,
      age: matchProfileData.age,
      gender: matchProfileData.gender,
      location: matchProfileData.location,
      programmingLanguage: matchProfileData.programmingLanguage,
      level: matchProfileData.level,
      preferences: matchProfileData.preferences,
      onboardingAnswers: matchProfileData.onboardingAnswers || {},
      biography: matchProfileData.biography || '',
      profileImageUrl: matchProfileData.profileImageUrl || '',
      createdAt: new Date(),
    });

    const savedMatchProfile = await newMatchProfile.save();
    return savedMatchProfile;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Retrieves a match profile by its ID.
 *
 * @param userId - The ID of the match profile to retrieve
 * @returns A Promise resolving to the match profile document or an error object
 */
export const getMatchProfile = async (userId: string): Promise<MatchProfileResponse> => {
  try {
    const matchProfile = await MatchProfileModel.findById(userId);
    if (!matchProfile) {
      return { error: 'Match Profile not found' };
    }
    return matchProfile;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Retrieves all match profiles from the database.
 *
 * @returns A Promise resolving to an array of match profiles documents or an error object
 */
export const getAllMatchProfiles = async (): Promise<
  DatabaseMatchProfile[] | { error: string }
> => {
  try {
    const matchProfiles = await MatchProfileModel.find({});
    return matchProfiles;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Updates user's match profiles information in the database.
 *
 * @param {string} username - The username of the user to update.
 * @param {Partial<User>} updates - An object containing the fields to update and their new values.
 * @returns {Promise<UserResponse>} - Resolves with the updated user object (without the password) or an error message.
 */
export const updateMatchProfile = async (
  userId: string,
  updates: Partial<MatchProfile>,
): Promise<MatchProfileResponse> => {
  try {
    const updatedProfile = await MatchProfileModel.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true },
    );

    if (!updatedProfile) {
      throw Error('Error updating match profile');
    }

    return updatedProfile;
  } catch (error) {
    return { error: `Error occurred when updating Match Profile: ${error}` };
  }
};

/**
 * Toggles a user's match profile active status.
 * If the user is currently active, they will be set to inactive.
 * If the user is currently inactive, they will be set to active.
 *
 * @param userId - The ID of the user whose match profile to update.
 * @param isActive - The new active status to set (true = active, false = inactive).
 * @returns A Promise resolving to the updated MatchProfile document or an error object.
 */
export const toggleMatchProfileActive = async (
  userId: string,
  isActive: boolean,
): Promise<MatchProfileResponse> => {
  return updateMatchProfile(userId, { isActive });
};

/**
 * Checks if a user has completed onboarding and their current active status.
 *
 * @param userId - The ID of the user to check.
 * @returns An object indicating if a MatchProfile exists and if it is active.
 */
export const checkOnboardingStatus = async (
  userId: string,
): Promise<{ exists: boolean; isActive: boolean } | { error: string }> => {
  try {
    const matchProfile = await MatchProfileModel.findOne({ userId })
      .lean<DatabaseMatchProfile>()
      .exec();

    if (!matchProfile) {
      return { exists: false, isActive: false };
    }

    return { exists: true, isActive: matchProfile.isActive };
  } catch (error) {
    return { error: `Error checking onboarding status: ${(error as Error).message}` };
  }
};
