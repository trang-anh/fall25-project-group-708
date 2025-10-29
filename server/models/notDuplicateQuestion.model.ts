// Not Duplicated Question Document Schema
import mongoose, { Model } from 'mongoose';
import { DatabaseNotDuplicateQuestion } from '../types/types';
import notDuplicateQuestionSchema from './schema/notDuplicateQuestion.schema';

/**
 * Mongoose model for the `Not Duplicate Question` collection.
 *
 * This model is created using the `Not Duplicate Question` interface and the `Not Duplicate Schema`, representing the
 * `Not Duplicate Question` collection in the MongoDB database, and provides an interface for interacting with
 * the stored not duplicate questions.
 *
 * @type {Model<DatabaseNotDuplicateQuestion>}
 */
const NotDuplicateQuestionModel: Model<DatabaseNotDuplicateQuestion> =
  mongoose.model<DatabaseNotDuplicateQuestion>(
    'NotDuplicateQuestion',
    notDuplicateQuestionSchema,
    'NotDuplicateQuestion',
  );

export default NotDuplicateQuestionModel;
