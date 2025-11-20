import MatchModel from '../models/match.model';
import MatchProfileModel from '../models/matchProfiles.model';
import {
  Match,
  DatabaseMatch,
  MatchResponse,
  GenerateMatchesResponse,
  PopulatedDatabaseMatchProfile,
} from '../types/types';
import extractFeatures from './matchFeature.service';
import computeScore from './matchMath.service';

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

/**
 * Generates or updates matches for a given user based on their match profile
 * and returns the list of match documents sorted by descending score.
 *
 * - Only considers other active match profiles.
 * - Skips pairs with no language overlap (skillOverlap = 0).
 */
export const generateMatchesForUser = async (userId: string): Promise<GenerateMatchesResponse> => {
  try {
    // 1. Get this user's populated match profile
    const userProfileDoc = await MatchProfileModel.findOne({ userId, isActive: true })
      .populate('programmingLanguage')
      .populate('preferences.preferredLanguages')
      .exec();

    if (!userProfileDoc) {
      return { error: 'Active MatchProfile not found for this user' };
    }

    const userProfile = userProfileDoc.toObject() as unknown as PopulatedDatabaseMatchProfile;

    // 2. Get all other active profiles
    const otherProfilesDocs = await MatchProfileModel.find({
      userId: { $ne: userId },
      isActive: true,
    })
      .populate('programmingLanguage')
      .populate('preferences.preferredLanguages')
      .exec();

    const matches: DatabaseMatch[] = [];

    for (const otherDoc of otherProfilesDocs) {
      const otherProfile = otherDoc.toObject() as unknown as PopulatedDatabaseMatchProfile;

      // 3. Extract features between user A and user B
      const features = extractFeatures(userProfile, otherProfile);

      const [skillOverlap] = features;

      // Enforce your requirement:
      // 3.6 Essential: Given User A (Python & Java), don't see User B (C, Assembly)
      // --> skip pairs with no shared languages
      if (skillOverlap === 0) {
        // no overlap in programmingLanguage -> don't create a match
        // eslint-disable-next-line no-continue
        continue;
      }

      // 4. Compute compatibility score (0–1)
      const score = computeScore(features);

      // 5. Upsert Match document for this pair
      //    We'll store userA as the caller, userB as the other profile.
      const matchDoc = await MatchModel.findOneAndUpdate(
        {
          userA: userProfile._id,
          userB: otherProfile._id,
        },
        {
          $set: {
            score,
            status: 'pending',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
        },
      ).exec();

      if (matchDoc) {
        matches.push(matchDoc.toObject() as DatabaseMatch);
      }
    }

    // 6. Sort matches by score descending
    matches.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return { matches };
  } catch (err) {
    return { error: (err as Error).message };
  }
};
