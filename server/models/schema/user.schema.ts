import { Schema } from 'mongoose';

/**
 * Mongoose schema for the User collection.
 *
 * This schema defines the structure for storing users in the database.
 * Each User includes the following fields:
 * - `username`: The username of the user.
 * - `password`: The encrypted password securing the user's account.
 * - `dateJoined`: The date the user joined the platform.
 * - `biography`: The biography/description of the user.
 * - `githubId`: The user's Github ID.
 * - `total_points`: The user point(s) for the user.
 * - `avatarUrl`: URL for the users' avatar.
 */
const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      immutable: true,
    },
    password: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    dateJoined: {
      type: Date,
    },
    biography: {
      type: String,
      default: '',
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorCode: {
      type: String,
      default: null,
    },
  },
  { collection: 'User' },
);

export default userSchema;
