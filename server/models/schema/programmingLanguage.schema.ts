import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Match Profile collection.
 *
 * This schema defines the structure for storing user's match profile in the database.
 * Each User includes the following fields:
 * - `username`: The username of the user.
 * - `password`: The encrypted password securing the user's account.
 * - `dateJoined`: The date the user joined the platform.
 */
const programmingLanguageSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

export default programmingLanguageSchema;
