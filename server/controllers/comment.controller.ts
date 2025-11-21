import express, { Response } from 'express';
import {
  AddCommentRequest,
  FakeSOSocket,
  PopulatedDatabaseQuestion,
  PopulatedDatabaseAnswer,
} from '../types/types';
import { addComment, saveComment } from '../services/comment.service';
import { populateDocument } from '../utils/database.util';
import { cleanText, moderateContent } from '../services/contentModeration.service';
import addRegisterPoints from '../services/registerPoints.service';

const commentController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Handles adding a new comment to the specified question or answer. The comment is first validated and then saved.
   * If the comment is invalid or saving fails, the HTTP response status is updated.
   *
   * @param req The AddCommentRequest object containing the comment data.
   * @param res The HTTP response object used to send back the result of the operation.
   * @param type The type of the comment, either 'question' or 'answer'.
   *
   * @returns A Promise that resolves to void.
   */
  const addCommentRoute = async (req: AddCommentRequest, res: Response): Promise<void> => {
    const id = req.body.id as string;

    const { comment, type } = req.body;

    try {
      //bad words checker
      const moderation = moderateContent({
        text: comment.text,
      });

      //counting words for point deductions
      const totalBadWords = Object.values(moderation.badWords).reduce(
        (sum, words) => sum + words.length,
        0,
      );

      //cleaning out any bad words to be stored in the database
      const cleanedComment = {
        ...comment,
        text: comment.text ? cleanText(comment.text) : comment.text,
      };

      // Deduct points if bad words were found, and add points if none were found
      if (totalBadWords > 0) {
        const pointsToDeduct = totalBadWords * -1;
        await addRegisterPoints(cleanedComment.commentBy, pointsToDeduct, 'HATEFUL_LANGUAGE');
      } else {
        await addRegisterPoints(cleanedComment.commentBy, 10, 'ACCEPT_ANSWER');
      }

      const comFromDb = await saveComment(cleanedComment);

      if ('error' in comFromDb) {
        throw new Error(comFromDb.error);
      }

      const status = await addComment(id, type, comFromDb);

      if (status && 'error' in status) {
        throw new Error(status.error);
      }

      // Populates the fields of the question or answer that this comment
      // was added to, and emits the updated object
      const populatedDoc = await populateDocument(id, type);

      if (populatedDoc && 'error' in populatedDoc) {
        throw new Error(populatedDoc.error);
      }

      socket.emit('commentUpdate', {
        result: populatedDoc as PopulatedDatabaseQuestion | PopulatedDatabaseAnswer,
        type,
      });
      res.json(comFromDb);
    } catch (err: unknown) {
      res.status(500).send(`Error when adding comment: ${(err as Error).message}`);
    }
  };

  router.post('/addComment', addCommentRoute);

  return router;
};

export default commentController;
