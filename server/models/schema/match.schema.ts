import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Match collection.
 *
 * This schema defines the structure for storing user match relationships in the database.
 * Each Match document represents a connection attempt between two users, along with its status
 * and metadata for how and when it was created.
 *
 * Fields:
 * - `userA`: The first user involved in the match (ObjectId reference to the `User` collection).
 * - `userB`: The second user involved in the match (ObjectId reference to the `User` collection).
 * - `status`: The current status of the match; one of `['pending', 'accepted', 'rejected']`.
 * - `score`: A numerical compatibility score between the two users.
 * - `initiatedBy`: The user who initiated the match request (ObjectId reference to the `User` collection).
 * - `createdAt`: The date and time the match was created.
 * - `updatedAt`: The date and time the match was last updated.
 */
const matchSchema: Schema = new Schema(
  {
    userA: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    userB: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
    },
    score: {
      type: Number,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  { collection: 'Match' },
);

export default matchSchema;
