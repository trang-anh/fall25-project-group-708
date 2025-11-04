import api from "./config";
import { Question, PopulatedDatabaseQuestion } from "@fake-stack-overflow/shared";

interface SaveNotDuplicateQuestionResponse {
  success: boolean;
  error?: string;
  data?: any
}


/**
 * saves a 'not duplicate question' to backend
 * 
 * @param newQuestion - the full question object being posted
 * @param similarQuestion - array of similar question object
 * @param justification - user's explanation of why it's not a duplicate
 * @param username - username of the person who posts
 * @returns promise with success status and any error message
 */
export const saveNotDuplicateQuestion = async (
  newQuestion: Question,
  similarQuestions: PopulatedDatabaseQuestion[],
  justification: string,
  username: string
): Promise<SaveNotDuplicateQuestionResponse> => {
  try {
    const notDuplicateQuestion = {
      username,
      question: newQuestion,
      duplicateOf: similarQuestions,
      justification,
      createdAt: new Date(),
    };

    // backend uses get method
    const response = await api.get(
      '/api/notDuplicateQuestion/saveNotDuplicateQuestion',
      {
        data: notDuplicateQuestion,
      }
    );

    if (response.status !== 200) {
      return {
        success: false,
        error: 'Failed to find duplicated question',
      };
    }
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error saving not duplicate question', error);
    return {
      success: false,
      error: error instanceof Error ? error.message: 'Unknown error occured', 
    };
  }
};