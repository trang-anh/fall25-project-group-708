import mongoose, { Model } from 'mongoose';
import { DatabaseRegisterPoints } from '../types/types';
import registerPoints from './schema/registerPoints.schema';

/**
 * Mongoose model for the Registered Points collection.
 */
const RegisterPointsModel: Model<DatabaseRegisterPoints> = mongoose.model<DatabaseRegisterPoints>(
  'registerPoints',
  registerPoints,
);

export default RegisterPointsModel;
