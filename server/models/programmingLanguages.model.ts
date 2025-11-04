import mongoose, { Model } from 'mongoose';
import programmingLanguageSchema from './schema/programmingLanguage.schema';
import { DabataseProgrammingLanguage } from '../types/types';

/**
 * Mongoose model for the `ProgrammingLanguage` collection.
 *
 * This model is created using the `Message` interface and the `messageSchema`, representing the
 * `Message` collection in the MongoDB database, and provides an interface for interacting with
 * the stored messages.
 *
 * @type {Model<DabataseProgrammingLanguage>}
 */
const MessageModel: Model<DabataseProgrammingLanguage> = mongoose.model<DabataseProgrammingLanguage>(
  'Message',
  programmingLanguageSchema,
);

export default MessageModel;