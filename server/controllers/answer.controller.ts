import express, { Response } from 'express';
import { ObjectId } from 'mongodb';
import { Answer, AddAnswerRequest, FakeSOSocket, PopulatedDatabaseAnswer } from '../types/types';
import { addAnswerToQuestion, saveAnswer } from '../services/answer.service';
import { populateDocument } from '../utils/database.util';
import { cleanText, moderateContent } from '../services/contentModeration.service';
import addRegisterPoints from '../services/registerPoints.service';

const answerController = (socket: FakeSOSocket) => {
  const router = express.Router();
  /**
   * Adds a new answer to a question in the database. The answer request and answer are
   * validated and then saved. If successful, the answer is associated with the corresponding
   * question. If there is an error, the HTTP response's status is updated.
   *
   * @param req The AnswerRequest object containing the question ID and answer data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addAnswer = async (req: AddAnswerRequest, res: Response): Promise<void> => {
    const { qid } = req.body;
    const ansInfo: Answer = req.body.ans;

    try {
      //bad words checker
      const moderation = moderateContent({
        text: ansInfo.text,
      });

      //counting words for point deductions
      const totalBadWords = Object.values(moderation.badWords).reduce(
        (sum, words) => sum + words.length,
        0,
      );

      //cleaning out any bad words to be stored in the database
      const cleanedAnswer = {
        ...ansInfo,
        text: ansInfo.text ? cleanText(ansInfo.text) : ansInfo.text,
      };

      // Deduct points if bad words were found, and add points if none were found
      if (totalBadWords > 0) {
        const pointsToDeduct = totalBadWords * -1;
        await addRegisterPoints(cleanedAnswer.ansBy, pointsToDeduct, 'HATEFUL_LANGUAGE');
      } else {
        await addRegisterPoints(cleanedAnswer.ansBy, 10, 'ACCEPT_ANSWER');
      }

      const ansFromDb = await saveAnswer(cleanedAnswer);

      if ('error' in ansFromDb) {
        throw new Error(ansFromDb.error as string);
      }

      const status = await addAnswerToQuestion(qid, ansFromDb);

      if (status && 'error' in status) {
        throw new Error(status.error as string);
      }

      const populatedAns = await populateDocument(ansFromDb._id.toString(), 'answer');

      if (populatedAns && 'error' in populatedAns) {
        throw new Error(populatedAns.error);
      }

      // Populates the fields of the answer that was added and emits the new object
      socket.emit('answerUpdate', {
        qid: new ObjectId(qid),
        answer: populatedAns as PopulatedDatabaseAnswer,
      });
      res.json(ansFromDb);
    } catch (err) {
      res.status(500).send(`Error when adding answer: ${(err as Error).message}`);
    }
  };

  // add appropriate HTTP verbs and their endpoints to the router.
  router.post('/addAnswer', addAnswer);

  return router;
};

export default answerController;
