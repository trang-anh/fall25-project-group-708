import mongoose, { Model } from 'mongoose';
import { DatabaseDailyPoints } from '../types/types';
import dailyPoints from './schema/community.schema';

/**
 * Mongoose model for the Daily Points collection.
 */
const DailyPointsModel: Model<DatabaseDailyPoints> = mongoose.model<DatabaseDailyPoints>(
  'Community',
  dailyPoints,
);

export default DailyPointsModel;
