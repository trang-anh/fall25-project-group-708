import { ObjectId } from 'mongodb';

/**
 * Represents a single points event for a user.
 * - `username`: The name of the user.
 * - `change_amount`: The number of points gained or lost.
 * - `reason`: Why the change occurred.
 * - `createdAt`: When the change was recorded.
 */
export interface RegisterPoints {
  username: string;
  change_amount: number; // positive = gained, negative = lost
  reason:
    | 'ACCEPT_ANSWER'
    | 'UPVOTE_OTHERS'
    | 'POST_QUESTION'
    | 'HATEFUL_LANGUAGE'
    | 'RECEIVE_DOWNVOTES';
  createdAt: Date;
}

/**
 * Represents a points event stored in the database.
 * - `_id`: Unique identifier of the record.
 */
export interface DatabaseRegisterPoints extends RegisterPoints {
  _id: ObjectId;
}

/**
 * Represents a fully populated registered points document.
 * (Same as DatabaseRegisterPoints since there are no refs.)
 */
export type PopulatedDatabaseRegisterPoints = DatabaseRegisterPoints;

/**
 * Represents possible responses for a RegisterPoints operation.
 * - Either a DatabaseRegisterPoints object or an error message.
 */
export type RegisterPointsResponse = DatabaseRegisterPoints | { error: string };
