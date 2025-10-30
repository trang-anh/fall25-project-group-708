import mongoose, { Model } from 'mongoose';
import matchSchema from './schema/match.schema';
import { DatabaseMatch } from '../types/types';

/**
 * Mongoose model for the `MatchProfile` collection.
 *
 * This model is created using the `MatchProfile` interface and the `matchProfileSchema`, representing the
 * `MatchProfile` collection in the MongoDB database, and provides an interface for interacting with
 * the stored collections.
 *
 */
const MatchModel: Model<DatabaseMatch> = mongoose.model<DatabaseMatch>('Match', matchSchema);

export default MatchModel;
