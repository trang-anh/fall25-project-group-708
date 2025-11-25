import MatchModel from '../models/match.model';
import MatchProfileModel from '../models/matchProfiles.model';
import {
  Match,
  DatabaseMatch,
  MatchResponse,
  GenerateMatchesResponse,
  MatchProfileWithUser,
} from '../types/types';
import extractFeatures from './matchFeature.service';
import computeScore from './matchMath.service';

/**
 * Creates a new match record between two users.
 *
 * @param matchData - The match information including userA, userB, status, score, and who initiated it.
 * @returns A Promise resolving to the newly created match document (normalized) or an error object.
 */
export const createMatch = async (matchData: Match): Promise<MatchResponse> => {
  try {
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
    const plain = savedMatch.toObject();

    return {
      ...plain,
      _id: plain._id.toString(),
      userA: plain.userA.toString(),
      userB: plain.userB.toString(),
      initiatedBy: plain.initiatedBy.toString(),
    } as DatabaseMatch;
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

    // Build otherUserProfile for each match
    const enriched = await Promise.all(
      matches.map(async match => {
        const otherUserId =
          match.userA.toString() === userId ? match.userB.toString() : match.userA.toString();

        const otherProfile = await MatchProfileModel.findOne({ userId: otherUserId })
          .populate('userId', 'username')
          .lean()
          .exec();

        return {
          ...match,
          _id: match._id.toString(),
          userA: match.userA.toString(),
          userB: match.userB.toString(),
          initiatedBy: match.initiatedBy?.toString() ?? null,
          otherUserProfile: otherProfile
            ? {
                ...otherProfile,
                userId:
                  typeof otherProfile.userId === 'object'
                    ? {
                        _id: otherProfile.userId._id.toString(),
                        username: otherProfile.userId.username,
                      }
                    : {
                        _id: otherProfile.userId.toString(),
                        username: 'Unknown',
                      },
              }
            : null,
        };
      }),
    );
    return enriched;
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
 * Updates the status of a match (accepted or rejected).
 *
 * @param matchId - The ID of the match being updated.
 * @param userId - The ID of the user performing the update.
 * @param newStatus - The new status to set.
 * @returns A Promise resolving to the updated match document or an error object.
 */
export const updateMatchStatus = async (
  matchId: string,
  userId: string,
  newStatus: 'accepted' | 'rejected',
): Promise<MatchResponse> => {
  try {
    const match = await MatchModel.findById(matchId);

    if (!match) {
      return { error: 'Match not found' };
    }

    // Only participants can update the match
    if (match.userA.toString() !== userId && match.userB.toString() !== userId) {
      return { error: 'Unauthorized: Only participants can update this match' };
    }

    match.status = newStatus;
    match.updatedAt = new Date();

    const saved = await match.save();
    return {
      ...saved.toObject(),
      _id: saved._id.toString(),
      userA: saved.userA.toString(),
      userB: saved.userB.toString(),
      initiatedBy: saved.initiatedBy?.toString() ?? null,
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * Generates match recommendations for a user based on similarity scoring.
 *
 * - Only considers active match profiles.
 * - Uses extracted feature vectors to compute a compatibility score.
 * - Skips recommendations with no language overlap.
 *
 * @param userId - The ID of the user requesting recommendations.
 * @returns A Promise resolving to an ordered list of recommended matches or an error object.
 */
export const generateMatchRecommendation = async (
  userId: string,
): Promise<GenerateMatchesResponse> => {
  try {
    // 1. Get this user's populated match profile
    const userProfileDoc = await MatchProfileModel.findOne({ userId, isActive: true })
      .populate('userId', 'username')
      .lean();
    if (!userProfileDoc) return { recommendations: [] };

    const userProfile = userProfileDoc as unknown as MatchProfileWithUser;

    // 2. Get all other active profiles
    const otherProfilesDocs = await MatchProfileModel.find({
      userId: { $ne: userId },
      isActive: true,
    })
      .populate('userId', 'username')
      .lean();

    // 3. Build recommendations
    const recommendations = otherProfilesDocs
      .map(doc => {
        const plainDoc = doc;

        if (!plainDoc.userId || typeof plainDoc.userId === 'string') {
          throw new Error('Populate failed: userId is still ObjectId/string');
        }

        const populatedUser = plainDoc.userId as { _id: string; username: string };

        const profile: MatchProfileWithUser = {
          ...plainDoc,
          userId: {
            _id: populatedUser._id.toString(),
            username: populatedUser.username,
          },
        };

        const features = extractFeatures(userProfile, profile);
        const score = computeScore(features);
        const [skillOverlap] = features;

        if (skillOverlap === 0) return null;

        return {
          userId: profile.userId._id.toString(),
          score,
          profile: {
            ...profile,
            userId: {
              _id: profile.userId._id.toString(),
              username: profile.userId.username,
            },
          },
        };
      })
      .filter(
        (r): r is { userId: string; score: number; profile: MatchProfileWithUser } => r !== null,
      )
      .sort((a, b) => b.score - a.score);

    return { recommendations };
  } catch (err) {
    return { error: (err as Error).message };
  }
};
