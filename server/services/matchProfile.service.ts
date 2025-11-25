import { ObjectId } from 'mongodb';
import MatchProfileModel from '../models/matchProfiles.model';
import {
  MatchProfile,
  MatchProfileResponse,
  DatabaseMatchProfile,
  PopulatedUser,
} from '../types/types';
import { Types } from 'mongoose';

/**
 * HELPER: Checks if the given userId is a populated user object instead of just a string.
 *
 * @param userId - Either the userId string or a populated user object.
 * @returns True if userId is an object with an _id field.
 */
function isPopulatedUserId(userId: string | PopulatedUser): userId is PopulatedUser {
  return typeof userId === 'object' && userId !== null && '_id' in userId;
}

/**
 * Creates a new match profile with the provided data.
 *
 * @param matchProfileData - Object containing match profile details including userid, active status, age, gender, location etc.
 * @returns A Promise resolving to the newly created match profile or an error object
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
    const populated = await savedMatchProfile.populate('userId', 'username');
    const obj = populated.toObject();

    // userId can be string OR populated object
    if (isPopulatedUserId(obj.userId)) {
      obj.userId._id = obj.userId._id.toString();
    }

    return obj;
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
    if (!Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid userId' };
    }

    const id = new ObjectId(userId);

    const matchProfile = await MatchProfileModel.findOne({ userId: id })
      .populate('userId', 'username')
      .lean();
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
    const matchProfiles = await MatchProfileModel.find({}).populate('userId', 'username').lean();
    return matchProfiles;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Updates an existing match profile with the given fields.
 *
 * @param userId - The ID of the user whose match profile is being updated.
 * @param updates - An object containing the fields to update.
 * @returns A Promise resolving to the updated profile or an error object.
 */
export const updateMatchProfile = async (
  userId: string,
  updates: Partial<MatchProfile>,
): Promise<MatchProfileResponse> => {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid userId' };
    }

    const id = new Types.ObjectId(userId);

    const updatedProfile = await MatchProfileModel.findOneAndUpdate(
      { userId: id },
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
    if (!Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid userId' };
    }

    const id = new Types.ObjectId(userId);
    const matchProfile = await MatchProfileModel.findOne({ userId: id })
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
