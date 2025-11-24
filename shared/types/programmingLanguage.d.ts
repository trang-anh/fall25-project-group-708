import { ObjectId } from 'mongodb';

/**
 * Represents a programming language.
 * - `name`: The name of the programming language.
 */
export interface ProgrammingLanguage {
  name: string;
}

/**
 * Represents a programming language stored in the database.
 */
export interface DatabaseProgrammingLanguage extends ProgrammingLanguage {
  _id: ObjectId;
}

/**
 * Type for community operation responses
 * Either returns a DatabaseCommunity (successful operation) or an error message
 */
export type ProgrammingLanguageResponse = DatabaseProgrammingLanguage | { error: string };
