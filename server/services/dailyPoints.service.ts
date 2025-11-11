/* eslint-disable no-console */
import DailyPointsModel from '../models/dailyPoints.model';

/**
 * Awarding points for the user, with the gain/loss cap of 30.
 * Applies partial gain/losses if exceeding the cap
 * If no action can be done, throw error
 *
 * @param username - The username of the user to adjust points.
 * @param pointsChange - The number of points to adjust.
 * @returns applied number.
 * @error if the points awarded are above 30, or the points lost are above 30
 */
const updateDailyPoints = async (username: string, pointsChange: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get current daily record
  let daily = await DailyPointsModel.findOne({
    username,
    date: { $gte: today, $lt: tomorrow },
  });

  if (!daily) {
    daily = await DailyPointsModel.create({
      username,
      date: today,
      total_gained: 0,
      total_lost: 0,
      net_change: 0,
    });
  }

  // Adding to gain
  if (pointsChange > 0) {
    const remaining = 30 - daily.total_gained;
    const applied = Math.max(0, Math.min(pointsChange, remaining));
    const blocked = pointsChange - applied;

    if (applied > 0) {
      await DailyPointsModel.findByIdAndUpdate(
        daily._id,
        {
          $inc: {
            total_gained: applied,
            net_change: applied,
          },
        },
        { new: true }, // Return updated document
      );
    }

    return { applied, blocked };
  }

  if (pointsChange < 0) {
    const remaining = 30 - daily.total_lost;
    const loss = Math.abs(pointsChange);
    const applied = Math.max(0, Math.min(loss, remaining));
    const blocked = loss - applied;

    if (applied > 0) {
      await DailyPointsModel.findByIdAndUpdate(
        daily._id,
        {
          $inc: {
            total_lost: applied,
            net_change: -applied,
          },
        },
        { new: true },
      );
    }

    return { applied, blocked };
  }

  return { applied: 0, blocked: 0 };
};

export default updateDailyPoints;
