import { FakeSOSocket, NotDuplicateQuestion, AddNotDuplicateQuestionRequest } from '../types/types';
import express, { Response } from 'express';
import saveNotDuplicateQuestion from '../services/notDuplicateQuestion.service';

const notDuplicateQuestionController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Adds a new Not Duplicate Question to the database. The question is first validated and then saved.
   *
   * @param req The AddNotDuplicateQuestionRequest object containing the question data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addNotDuplicateQuestion = async (
    req: AddNotDuplicateQuestionRequest,
    res: Response,
  ): Promise<void> => {
    const question: NotDuplicateQuestion = req.body;
    try {
      const result = await saveNotDuplicateQuestion(question);

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Convert MongoDB document to plain object with string IDs
      const responseData = {
        _id: result._id.toString(),
        username: result.username,
        question: result.question.toString(),
        duplicateOf: result.duplicateOf.map(id => id.toString()),
        justification: result.justification,
        createdAt: result.createdAt,
      };

      res.json(responseData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when saving not duplicate question: ${err.message}`);
      } else {
        res.status(500).send(`Error when saving not duplicate question`);
      }
    }
  };

  router.post('/saveNotDuplicateQuestion', addNotDuplicateQuestion);
  return router;
};

export default notDuplicateQuestionController;
