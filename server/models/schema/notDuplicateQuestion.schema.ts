import { Schema } from 'mongoose';
/**
 * Mongoose schema for the Not Duplicate Questions collection.
 *
 * This schema defines the structure for storing not duplicate questions in the database.
 * Each question includes the following fields:
 * - `username`: The name of the user submitted the question.
 * - `question`: The question that is posted.
 * - `duplicateOf`: The list of questions that is pinged as similar to the question posted.
 * - `justification`: The detailed content of why it is not a dupe.
 * - `createdAt`: The date and time when the justification was posted/sent.
 */
const notDuplicateQuestionSchema: Schema = new Schema(
  {
    username: {
      type: String,
    },
    question: { type: Schema.Types.ObjectId, ref: 'Question' },
    duplicateOf: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    justification: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'NotDuplicateQuestion' },
);

export default notDuplicateQuestionSchema;
