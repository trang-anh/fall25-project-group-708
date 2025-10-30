import mongoose, { Model } from 'mongoose';
import matchProfileSchema from './schema/matchProfile.schema';
import { DatabaseMatchProfile } from '../types/types';

/**
 * Mongoose model for the `MatchProfile` collection.
 *
 * This model is created using the `MatchProfile` interface and the `matchProfileSchema`, representing the
 * `MatchProfile` collection in the MongoDB database, and provides an interface for interacting with
 * the stored collections.
 *
 */
const MatchProfileModel: Model<DatabaseMatchProfile> = mongoose.model<DatabaseMatchProfile>(
  'MatchProfile',
  matchProfileSchema,
);

export default MatchProfileModel;
