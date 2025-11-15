import { ObjectId } from 'mongodb';
import { Request } from 'express';
import { Question } from './question';

/**
 * Represents a justification for marking a question as "Not a duplicate".
 * - `username`: The person who submitted the new Question and deemed it as not a duplicate
 * - `question`: The ID of the new question published
 * - `duplicateOf`: The list of IDs that are similar to the question posted.
 * - `justification`: This would be the optional user justification on why it is not a duplicate.
 * - `createdAt`: The timestamp when the question was asked.
 */
export interface NotDuplicateQuestion {
  username: string;
  question: ObjectId;
  duplicateOf: ObjectId[];
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

/**
 * Represents a fully populated not duplicated question from the database.
 * - `duplicateOf`: The list of questions (IDs) that is a similar catch to the posted question.
 */
export interface PopulatedDatabaseNotDuplicateQuestion
  extends Omit<DatabaseNotDuplicateQuestion, 'question' | 'duplicateOf'> {
  question: Question;
  duplicateOf: Question[];
}

/**
 * Type representing possible responses for a NotDuplicateQuestion-related operation.
 * - Either a `NotDuplicateQuestion` object or an error message.
 */
export type NotDuplicateQuestionResponse = DatabaseNotDuplicateQuestion | { error: string };

/**
 * Interface for the request body when adding a new not duplicate question.
 * - `body`: The question being added.
 */
export interface AddNotDuplicateQuestionRequest extends Request {
  body: NotDuplicateQuestion;
}
