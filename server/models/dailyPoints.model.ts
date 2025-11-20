import mongoose, { Model } from 'mongoose';
import { DatabaseDailyPoints } from '../types/types';
import dailyPoints from './schema/dailyPoints.schema';

/**
 * Mongoose model for the Daily Points collection.
 */
const DailyPointsModel: Model<DatabaseDailyPoints> = mongoose.model<DatabaseDailyPoints>(
  'dailyPoints',
  dailyPoints,
);

export default DailyPointsModel;
