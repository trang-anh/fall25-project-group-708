import RegisterPointsModel from '../models/registerPoints.model';
import updateDailyPoints from './dailyPoints.service';

/**
 * Registering the points added to or deducted from the user.
 *
 * @param username - The username of the user with points to be changed/registered.
 * @param pointsChange - The number of points changed.
 * @param reason - The reason for the point update (one of the enum listed)
 * ENUM: 'ACCEPT_ANSWER','UPVOTE_OTHERS', 'POST_QUESTION', 'HATEFUL_LANGUAGE', 'RECEIVE_DOWNVOTES'
 */
const addRegisterPoints = async (username: string, pointsChange: number, reason: string) => {
  try {
    const today = new Date();
    const entry = await RegisterPointsModel.create({
      username,
      change_amount: pointsChange,
      reason,
      createdAt: today,
    });

    if (!entry) {
      throw new Error('Failed to add new entry to Register Points');
    }

    //Updating the points the user receives daily, and checking to see if it is over the limit.
    updateDailyPoints(username, pointsChange);

    return entry;
  } catch (error) {
    return { error: (error as Error).message };
  }
};

export default addRegisterPoints;
