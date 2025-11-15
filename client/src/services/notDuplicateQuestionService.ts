import api from './config';
import { NotDuplicateQuestion, PopulatedDatabaseNotDuplicateQuestion } from '../types/types';

const NOT_DUPLICATED_QUESTION_API_URL = `/api/notDuplicateQuestion`;

/**
 * Function to add a NotDuplicateQuestion.
 *
 * @param q - The entry object to add.
 * @throws Error if there is an issue creating the new question.
 */
const saveNotDuplicateQuestion = async (
  q: NotDuplicateQuestion,
): Promise<PopulatedDatabaseNotDuplicateQuestion> => {
  const res = await api.post(`${NOT_DUPLICATED_QUESTION_API_URL}/saveNotDuplicateQuestion`, q);

  if (res.status !== 200) {
    throw new Error('Error while creating a new question');
  }

  return res.data;
};

export default saveNotDuplicateQuestion;
