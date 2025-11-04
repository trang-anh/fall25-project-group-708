import { Schema } from 'mongoose';
/**
 * Mongoose schema for the User's Registered Points collection.
 *
 * This schema defines the structure for storing the user's registered points in the database.
 * Each question includes the following fields:
 * - `username`: The name of the user for point system.
 * - `change_amount`: The amount of points that got taken off/added on.
 * - `reason`: The reason that the user got points off for.
 * - `createdAt`: The date and time when the points were updated.
 */
const registerPoints: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    change_amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        //positive points
        'ACCEPT_ANSWER',
        'UPVOTE_OTHERS',
        'POST_QUESTION',
        //negative points
        'HATEFUL_LANGUAGE',
        'RECEIVE_DOWNVOTES',
      ],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: 'registerPoints' },
);

export default registerPoints;
