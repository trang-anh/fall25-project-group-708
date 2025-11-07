import { Schema } from 'mongoose';
/**
 * Mongoose schema for the User's Daily Points collection.
 *
 * This schema defines the structure for storing the user's daily points in the database.
 * Each question includes the following fields:
 * - `username`: The name of the user for point system.
 * - `total_gained`: The amount of points that the user gained.
 * - `total_lost`: The amount of points that the user lost.
 * - `net_change`: The date and time when the points were updated.
 * - `date`: The date and time when the points were updated.
 */
const dailyPoints: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    total_gained: {
      type: Number,
      default: 0,
    },
    total_lost: {
      type: Number,
      default: 0,
    },
    net_change: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { collection: 'dailyPoints' },
);

export default dailyPoints;
