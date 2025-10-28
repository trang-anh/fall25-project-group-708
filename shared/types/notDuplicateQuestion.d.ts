import { ObjectId } from 'mongodb';

/**
 * Represents a justification for marking a question as "Not a duplicate".
 * - `username`: The person who submitted the new Question and deemed it as not a duplicate
 * - `questionId`: The ID of the new question published
 * - `duplicateOf`: The list of IDs that are similar to the question posted.
 * - `justification`: This would be the optional user justification on why it is not a duplicate.
 * - `createdAt`: The timestamp when the question was asked.
 * - `reviewed`: An array of answers related to the question.
 * - `reviewedBy`: The possible person who reviewed the justification.
 * - `reviewedAt`: The timestamp when the duplicate question justification was reviewed.
 */
export interface NotDuplicateQuestion {
  username: ObjectId;
  question: Question;
  duplicateOf: Question[];
  justification: string;
  createdAt: Date;
}

/**
 * Represents a not duplicate question stored in the database.
 * - `_id`: Unique identifier for the question.
 * - `question`: The new question (ID) that is saved.
 * - `duplicateOf`: The list of questions (IDs) that is a similar catch to the posted question.
 */
export interface DatabaseNotDuplicateQuestion
  extends Omit<NotDuplicateQuestion, 'question' | 'duplicateOf'> {
  _id: ObjectId;
  question: ObjectId;
  duplicateOf: ObjectId[];
}
