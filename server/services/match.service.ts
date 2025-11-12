import MatchModel from '../models/match.model';
import { Match, DatabaseMatch, MatchResponse } from '../types/types';

/**
 * Creates a new community with the provided data.
 * The admin user is automatically added to the participants list if not already included.
 *
 * @param communityData - Object containing community details including name, description, visibility, admin, and participants
 * @returns A Promise resolving to the newly created community document or an error object
 */
export const createMatch = async (matchData: Match): Promise<MatchResponse> => {
  try {
    // Ensure admin is included in the participants list
    const newMatch = new MatchModel({
      userA: matchData.userA,
      userB: matchData.userB,
      status: matchData.status ?? 'pending', // default to pending
      score: matchData.score ?? 0,
      initiatedBy: matchData.initiatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedMatch = await newMatch.save();
    return savedMatch.toObject() as DatabaseMatch;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Retrieves a match by its ID.
 *
 * @param matchId - The ID of the match to retrieve
 * @returns A Promise resolving to the match profile document or an error object
 */
export const getMatch = async (matchId: string): Promise<MatchResponse> => {
  try {
    const match = await MatchModel.findById(matchId).lean<DatabaseMatch>().exec();
    if (!match) {
      return { error: 'Match Profile not found' };
    }
    return match;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Retrieves all matches of a user by the user ID.
 *
 * @param matchId - The ID of the match to retrieve
 * @returns A Promise resolving to the match profile document or an error object
 */
export const getUserMatches = async (
  userId: string,
): Promise<DatabaseMatch[] | { error: string }> => {
  try {
    const matches = await MatchModel.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .lean<DatabaseMatch[]>()
      .exec();

    if (!matches.length) return { error: 'No matches found for this user' };
    return matches;
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Deletes a match by its ID if the requesting user is one of the participants.
 *
 * @param matchId - The ID of the match to delete
 * @param userId - The ID of the user requesting deletion
 * @returns A Promise resolving to the deleted match document or an error object
 */
export const deleteMatch = async (matchId: string, userId: string): Promise<MatchResponse> => {
  try {
    // First get the match
    const match = await MatchModel.findById(matchId);

    if (!match) {
      return { error: 'Match not found' };
    }

    // Check if the user is in the match
    if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
      return { error: 'Unauthorized: Only participants can delete this match' };
    }

    // If user is one of the participants, proceed with deletion
    const deletedMatch = await MatchModel.findByIdAndDelete(matchId);

    if (!deletedMatch) {
      return { error: 'Match not found or already deleted' };
    }

    return deletedMatch;
  } catch (err) {
    return { error: (err as Error).message };
  }
};
