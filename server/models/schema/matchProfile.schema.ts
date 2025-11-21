import { Schema } from 'mongoose';

/**
 * Mongoose schema for the Match Profile collection.
 *
 * This schema defines the structure for storing a user's match profile in the database.
 * Each Match Profile includes the following fields:
 * - `userId`: Reference to the User document associated with this profile.
 * - `isActive`: Whether the profile is visible for matching.
 * - `age`: The user's age.
 * - `gender`: The user's gender identity.
 * - `location`: The user's general geographic region.
 * - `programmingLanguage`: The programming languages the user knows.
 * - `level`: The user's self-assessed skill level.
 * - `preferences`: The user's matching preferences, such as desired languages or skill level.
 * - `onboardingAnswers`: The user's responses to onboarding questions about goals, personality, and project type.
 * - `biography`: A short description or bio provided by the user.
 * - `profileImageUrl`: The URL of the user's profile image.
 * - `createdAt`: The date the match profile was created.
 */
const matchProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
        'ANTARCTICA',
      ],
    },
    programmingLanguage: {
      type: [{ String }],
    },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      required: true,
      default: 'BEGINNER',
    },
    preferences: {
      preferredLanguages: { type: [{ String }] },
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
