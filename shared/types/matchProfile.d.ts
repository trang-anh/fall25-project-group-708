import { Request } from 'express';

/**
 * Represents a match profile.
 * - `username`: The username of the user.
 * - `isActive`: The description of the collection.
 * - `questions`: The questions that have been added to the collection.
 */
export interface MatchProfile {
  userId: string;
  isActive: boolean;
  age: number;
  gender: string;
  location: string;
  programmingLanguage: string[];
  level: string;

  preferences: {
    preferredLanguages: string[];
    preferredLevel: string;
  };

  onboardingAnswers?: {
    goals?: string;
    personality?: string;
    projectType?: string;
  };

  biography?: string;
  profileImageUrl?: string;
}

/**
 * Represents a match profile stored in the database.
 * - `_id`: The unique identifier of the match profile.
 * - `userId`:
 * - `languages: The programming languages that have been added to the match profile.
 * - `preferredLanguage: The preferred programming languages that have been added to the match profile.
 */
export interface DatabaseMatchProfile
  extends Omit<MatchProfile, 'programmingLanguage' | 'preferences'> {
  _id: string;
  userId: string | PopulatedUser;
  isActive: boolean;
  createdAt: Date;

  programmingLanguage: string[];

  preferences: {
    preferredLanguages: string[];
    preferredLevel: string;
  };
}

/**
 * Represents a populated user profile.
 */
interface PopulatedUser {
  _id: string;
  username: string;
}

/**
 * Represents a populated match profile with username.
 */
export interface MatchProfileWithUser extends Omit<DatabaseMatchProfile, 'userId'> {
  userId: PopulatedUser;
}

/**
 * Type definition for create a match profile request
 */
export interface CreateMatchProfileRequest extends Request {
  body: MatchProfile;
}

/**
 * Represents a request to get a user's match profile by id.
 * - `collectionId`: The unique identifier of the collection.
 */

export interface MatchProfileRequest extends Request {
  params: {
    userId: string;
  };
}

/**
 * Type definition for join/leave community request
 */
export interface ToggleMatchProfileActiveRequest extends Request {
  body: {
    userId: string;
    isActive: boolean;
  };
}

/**
 * Represents a request to update a match profile.
 * - `userId`: The ID of the user whose match profile is being updated (from params)
 * - `body`: Partial match profile fields to update
 */
export interface UpdateMatchProfileRequest extends Request {
  params: {
    userId: string;
  };
  body: Partial<MatchProfile>;
}

/**
 * Type for community operation responses
 * Either returns a DatabaseCommunity (successful operation) or an error message
 */
export type MatchProfileResponse = DatabaseMatchProfile | { error: string };
