import { Request } from 'express';
import { DatabaseMatchProfile } from './matchProfile';

/**
 * Represents a match between two users.
 * Each Match document stores the relationship between userA and userB,
 * including its current status, optional compatibility score,
 * and who initiated the match.
 *
 * Fields:
 * - `userA`: The first user in the match (ObjectId reference to User).
 * - `userB`: The second user in the match (ObjectId reference to User).
 * - `status`: The current status of the match (e.g., 'pending', 'accepted', 'rejected').
 * - `score`: A numeric compatibility score between the two users.
 * - `initiatedBy`: The user who initiated the match request.
 */
export interface Match {
  userA: string;
  userB: string;
  status: string;
  score: number;
  initiatedBy: string;
}

/**
 * Represents a match record stored in the database.
 * - `_id`: The unique identifier of the match.
 * - `createdAt`: The date the match was created.
 * - `updatedAt`: The date the match was last updated.
 */
export interface DatabaseMatch extends Match {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a populated match record.
 * Includes the full `DatabaseMatchProfile` objects for both users,
 * instead of just their ObjectId references.
 */
export interface PopulatedDatabaseMatch extends Omit<DatabaseMatch, 'userA' | 'userB'> {
  userA: DatabaseMatchProfile;
  userB: DatabaseMatchProfile;
}

/**
 * Type definition for creating a new match request.
 */
export interface CreateMatchRequest extends Request {
  body: Match;
}

/**
 * Type definition for creating a new match request.
 */
export interface DeleteMatchRequest extends Request {
  body: {
    userId: string;
  };
}

/**
 * Represents a response for match operations.
 * Either returns a `DatabaseMatch` object or an error message.
 */
export type MatchResponse = DatabaseMatch | { error: string };

/**
 * Represents a response for match generated operations.
 * Either returns a `DatabaseMatch` object or an error message.
 */
export interface GenerateMatchesResponse {
  recommendations?: {
    userId: string;
    score: number;
    profile: PopulatedDatabaseMatchProfile;
  }[];
  error?: string;
}

/**
 * Represents a request to fetch or modify a specific match by ID.
 * Used in routes like `GET /api/match/:matchId`.
 */
export interface MatchRequest extends Request {
  params: {
    matchId: string;
  };
}

/**
 * Represents a request to fetch all matches for a given user.
 * Used in routes like `GET /api/match/user/:userId`.
 */
export interface GetUserMatchesRequest extends Request {
  params: {
    userId: string;
  };
}

/**
 * Data sent from the client to create a match.
 * Does NOT include _id, createdAt, or updatedAt.
 */
export interface CreateMatchDTO {
  userA: string;
  userB: string;
  status: string;
  score: number;
  initiatedBy: string;
}

export interface CreateMatchDTORequest extends Request {
  body: CreateMatchDTO;
}
