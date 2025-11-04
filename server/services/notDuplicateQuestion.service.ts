import {
  DatabaseNotDuplicateQuestion,
  NotDuplicateQuestion,
  NotDuplicateQuestionResponse,
} from '../types/types';
import NotDuplicateQuestionModel from '../models/notDuplicateQuestion.model';

/**
 * Adds a "Not Duplicate" justification record.
 * @param {NotDuplicateQuestion} notDuplicateQuestion - The justification record to add.
 * @returns {Promise<NotDuplicateQuestionResponse>} - The saved question or error message
 */
const saveNotDuplicateQuestion = async (
  notDuplicateQuestion: NotDuplicateQuestion,
): Promise<NotDuplicateQuestionResponse> => {
  try {
    const result: DatabaseNotDuplicateQuestion =
      await NotDuplicateQuestionModel.create(notDuplicateQuestion);

    return result;
  } catch (error) {
    return { error: 'Error when saving a question' };
  }
};

export default saveNotDuplicateQuestion;
