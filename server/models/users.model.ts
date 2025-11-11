import mongoose, { Model, Document } from 'mongoose';
import userSchema from './schema/user.schema';
import { DatabaseUser } from '../types/types';
import { User } from '../types/types';

/**
 * Interface for User Document with Mongoose methods
 * Extends the User interface
 */
export interface UserDocument extends User, Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  dateJoined: Date;
  biography?: string;
  githubId?: string;
  totalPoints?: number;
  avatarUrl?: string;
}

/**
 * Mongoose model for the `User` collection.
 *
 * This model is created using the `User` interface and the `userSchema`, representing the
 * `User` collection in the MongoDB database, and provides an interface for interacting with
 * the stored users.
 *
 * @type {Model<DatabaseUser>}
 */
const UserModel: Model<DatabaseUser> = mongoose.model<DatabaseUser>('User', userSchema);

export default UserModel;
