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
const matchProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'NON-BINARY', 'PREFER TO NOT DESCRIBE'],
      required: true,
      default: '',
    },
    location: {
      type: String,
      enum: [
        'NORTH AMERICA',
        'SOUTH AMERICA',
        'EUROPE',
        'ASIA',
        'AFRICA',
        'AUSTRALIA',
        'ANTARTICA',
      ],
    },
    programmingLanguage: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ProgrammingLanguage',
      },
    ],
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
      default: 'BEGINNER',
    },
    preferences: {
      preferredLanguages: [
        {
          type: Schema.Types.ObjectId,
          ref: 'ProgrammingLanguage',
        },
      ],
      preferredLevel: {
        type: String,
        enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      },
    },
    onboardingAnswers: {
      goals: {
        type: String,
        trim: true,
      },
      personality: {
        type: String,
        trim: true,
      },
      projectType: {
        type: String,
        trim: true,
      },
    },
    biography: {
      type: String,
      default: '',
    },
    profileImageUrl: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
    },
  },
  { collection: 'MatchProfile' },
);

export default matchProfileSchema;
