/**
 * Represents user's daily points.
 * - `username`: The name of the user.
 * - `total_gained`: The points gained.
 * - `total_lost`: The points losts.
 * - `net_change`: The change of gained - losts.
 * - `date`: The date of the day.
 */
export interface DailyPoints {
  username: string;
  total_gained: number;
  total_lost: number;
  net_change: number;
  date: Date;
}

/**
 * Represents a daily point stored in the database.
 * - `_id`: Unique identifier for the daily points saved
 */
export interface DatabaseDailyPoints extends DailyPoints {
  _id: ObjectId;
}

/**
 * Represents a fully populated daily points document from the database.
 */
export type PopulatedDatabaseDailyPoints = DatabaseDailyPoints;

/**
 * Type representing possible responses for a daily point operation.
 * - Either a `dailypoint` object or an error message.
 */
export type DailyPointsResponse = DatabaseDailyPoints | { error: string };
