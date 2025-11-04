import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { ProgrammingLanguage } from './programmingLanguage';

/**
 * Represents a match profile.
 * - `username`: The username of the user.
 * - `isActive`: The description of the collection.
 * - `questions`: The questions that have been added to the collection.
 */
export interface MatchProfile {
  userId: ObjectId;
  isActive: boolean;
  age: number;
  gender: string;
  location: string;
  programmingLanguage: ProgrammingLanguage[];
  level: string;

  preferences: {
    preferredLanguages: ProgrammingLanguage[];
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
  extends Omit<MatchProfile, 'programmingLanguages', 'preferences'> {
  _id: ObjectId;
  userId: ObjectId;
  programmingLanguage: ObjectId[];
  preferences: {
    preferredLanguages: ObjectId[];
    preferredLevel: string;
  };
  createdAt: Date;
}

/**
 * Represents a populated match profile.
 * - Includes full ProgrammingLanguage and User objects.
 */
export interface PopulatedDatabaseMatchProfile
  extends Omit<DatabaseMatchProfile, 'programmingLanguages', 'preferences'> {
  programmingLanguage: ProgrammingLanguage[];
  preferences: {
    preferredLanguages: ProgrammingLanguage[];
    preferredLevel: string;
  };
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
 * Type for community operation responses
 * Either returns a DatabaseCommunity (successful operation) or an error message
 */
export type MatchProfileResponse = DatabaseMatchProfile | { error: string };
