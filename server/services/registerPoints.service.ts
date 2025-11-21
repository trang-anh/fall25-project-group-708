import RegisterPointsModel from '../models/registerPoints.model';
import updateDailyPoints from './dailyPoints.service';
import { updateUserTotalPoints } from './user.service';

/**
 * Registering the points added to or deducted from the user.
 *
 * @param username - The username of the user with points to be changed/registered.
 * @param pointsChange - The number of points changed.
 * @param reason - The reason for the point update (one of the enum listed)
 * ENUM: 'ACCEPT_ANSWER','UPVOTE_OTHERS', 'POST_QUESTION', 'HATEFUL_LANGUAGE', 'RECEIVE_DOWNVOTES'
 */
const addRegisterPoints = async (
  username: string,
  pointsChange: number,
  reason: string,
  questionId?: string,
) => {
  try {
    const today = new Date();

    // Update daily limit
    const { applied, blocked } = await updateDailyPoints(username, pointsChange);

    if (applied === 0) {
      return { applied: 0, blocked, message: 'Daily limit reached' };
    }

    // Update users total points
    await updateUserTotalPoints(username, applied);

    // Logging the applied amount to register
    const entry = await RegisterPointsModel.create({
      username,
      change_amount: applied,
      reason,
      questionId,
      createdAt: today,
    });

    if (!entry) {
      throw new Error('Failed to add new entry to Register Points');
    }

    return { applied, blocked, entry };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

/**
 * Check if user has already received points for upvoting this question
 *
 * @param username the username of the person receiving points
 * @param questionId the question id where the upvote happened
 * @returns true if the user have upvoted before, false otherwise
 */
const hasReceivedUpvotePoints = async (username: string, questionId: string): Promise<boolean> => {
  const existingEntry = await RegisterPointsModel.findOne({
    username,
    reason: 'UPVOTE_OTHERS',
    questionId,
  });

  return !!existingEntry;
};

/**
 * Check if user has already been penalized for receiving a downvote on this question
 *
 * @param username the username of the person receiving bad points
 * @param questionId the question id where the downvote happened
 * @returns true if the user have been penalized for that question before, false otherwise
 */
const hasReceivedDownvotePenalty = async (
  username: string,
  questionId: string,
): Promise<boolean> => {
  const existingEntry = await RegisterPointsModel.findOne({
    username,
    reason: 'RECEIVE_DOWNVOTES',
    questionId,
  });

  return !!existingEntry;
};

export default addRegisterPoints;

export { hasReceivedUpvotePoints, hasReceivedDownvotePenalty };
