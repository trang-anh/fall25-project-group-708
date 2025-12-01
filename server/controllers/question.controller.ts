import express, { Response } from 'express';
import {
  Question,
  FindQuestionRequest,
  FindQuestionByIdRequest,
  AddQuestionRequest,
  VoteRequest,
  FakeSOSocket,
  PopulatedDatabaseQuestion,
  CommunityQuestionsRequest,
  FindQuestionByTitleAndText,
  DatabaseQuestion,
} from '../types/types';
import {
  addVoteToQuestion,
  fetchAndIncrementQuestionViewsById,
  fetchFiveQuestionsByTextAndTitle,
  filterQuestionsByAskedBy,
  filterQuestionsBySearch,
  getCommunityQuestions,
  getQuestionsByOrder,
  saveQuestion,
} from '../services/question.service';
import { processTags } from '../services/tag.service';
import { populateDocument } from '../utils/database.util';
import UserModel from '../models/users.model';
import { cleanText, moderateContent } from '../services/contentModeration.service';
import addRegisterPoints from '../services/registerPoints.service';

const questionController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Retrieves a list of questions filtered by a search term and ordered by a specified criterion.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The FindQuestionRequest object containing the query parameters `order` and `search`.
   * @param res The HTTP response object used to send back the filtered list of questions.
   *
   * @returns A Promise that resolves to void.
   */
  const getQuestionsByFilter = async (req: FindQuestionRequest, res: Response): Promise<void> => {
    const { order } = req.query;
    const { search } = req.query;
    const { askedBy } = req.query;

    try {
      let qlist: PopulatedDatabaseQuestion[] = await getQuestionsByOrder(order);

      // Filter by askedBy if provided
      if (askedBy) {
        qlist = filterQuestionsByAskedBy(qlist, askedBy);
      }

      // Filter by search keyword and tags
      const resqlist: PopulatedDatabaseQuestion[] = filterQuestionsBySearch(qlist, search);
      res.json(resqlist);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching questions by filter: ${err.message}`);
      } else {
        res.status(500).send(`Error when fetching questions by filter`);
      }
    }
  };

  /**
   * Retrieves a question by its unique ID, and increments the view count for that question.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The FindQuestionByIdRequest object containing the question ID as a parameter.
   * @param res The HTTP response object used to send back the question details.
   *
   * @returns A Promise that resolves to void.
   */
  const getQuestionById = async (req: FindQuestionByIdRequest, res: Response): Promise<void> => {
    const { qid } = req.params;
    const { username } = req.query;

    try {
      const q = await fetchAndIncrementQuestionViewsById(qid, username);

      if ('error' in q) {
        throw new Error('Error while fetching question by id');
      }

      socket.emit('viewsUpdate', q);
      res.json(q);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching question by id: ${err.message}`);
      } else {
        res.status(500).send(`Error when fetching question by id`);
      }
    }
  };

  /**
   * Adds a new question to the database. The question is first validated and then saved.
   * If the tags are invalid or saving the question fails, the HTTP response status is updated.
   *
   * @param req The AddQuestionRequest object containing the question data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addQuestion = async (req: AddQuestionRequest, res: Response): Promise<void> => {
    const question: Question = req.body;

    try {
      //clean tags before processing them into ObjectIds
      const cleanedQuestion = {
        ...question,
        title: question.title ? cleanText(question.title) : question.title,
        text: question.text ? cleanText(question.text) : question.text,
        tags: question.tags
          ? question.tags.map(tag => ({
              ...tag,
              name: cleanText(tag.name),
            }))
          : question.tags,
      };

      //bad words checker
      const moderation = moderateContent({
        title: question.title,
        text: question.text,
        tags: question.tags?.map(tag => tag.name),
      });

      const totalBadWords = Object.values(moderation.badWords).reduce(
        (sum, words) => sum + words.length,
        0,
      );

      //process cleaned tags - this returns DatabaseTag[]
      const processedTags = await processTags(cleanedQuestion.tags);

      if (processedTags.length === 0) {
        throw new Error('Invalid tags');
      }

      const questionswithtags = {
        ...cleanedQuestion,
        tags: processedTags.map(tag => tag._id),
      };

      const result = await saveQuestion(questionswithtags);

      if ('error' in result) {
        throw new Error(result.error);
      }

      const savedQuestion = result as DatabaseQuestion;

      // Deduct points if bad words were found, and add points if none were found
      if (totalBadWords > 0) {
        const pointsToDeduct = totalBadWords * -1;
        await addRegisterPoints(question.askedBy, pointsToDeduct, 'HATEFUL_LANGUAGE');
      } else {
        await addRegisterPoints(question.askedBy, 5, 'POST_QUESTION');
      }

      // Populates the fields of the question that was added, and emits the new object
      const populatedQuestion = await populateDocument(savedQuestion._id.toString(), 'question');

      if ('error' in populatedQuestion) {
        throw new Error(populatedQuestion.error);
      }

      socket.emit('questionUpdate', populatedQuestion as PopulatedDatabaseQuestion);

      res.json(populatedQuestion);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when saving question: ${err.message}`);
      } else {
        res.status(500).send(`Error when saving question`);
      }
    }
  };

  /**
   * Helper function to handle upvoting or downvoting a question.
   *
   * @param req The VoteRequest object containing the question ID and the username.
   * @param res The HTTP response object used to send back the result of the operation.
   * @param type The type of vote to perform (upvote or downvote).
   *
   * @returns A Promise that resolves to void.
   */
  const voteQuestion = async (
    req: VoteRequest,
    res: Response,
    type: 'upvote' | 'downvote',
  ): Promise<void> => {
    const { qid, username } = req.body;

    try {
      const status = await addVoteToQuestion(qid, username, type);

      if (status && 'error' in status) {
        throw new Error(status.error);
      }

      // Emit the updated vote counts to all connected clients
      socket.emit('voteUpdate', { qid, upVotes: status.upVotes, downVotes: status.downVotes });

      //Fetch and emit updated user points
      const updatedUser = await UserModel.findOne({ username }).select('-password');
      if (updatedUser) {
        socket.emit('userUpdate', {
          user: updatedUser,
          type: 'updated',
        });
      }

      res.json(status);
    } catch (err) {
      res.status(500).send(`Error when ${type}ing: ${(err as Error).message}`);
    }
  };

  /**
   * Handles upvoting a question. The request must contain the question ID (qid) and the username.
   * If the request is invalid or an error occurs, the appropriate HTTP response status and message are returned.
   *
   * @param req The VoteRequest object containing the question ID and the username.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const upvoteQuestion = async (req: VoteRequest, res: Response): Promise<void> => {
    voteQuestion(req, res, 'upvote');
  };

  /**
   * Handles downvoting a question. The request must contain the question ID (qid) and the username.
   * If the request is invalid or an error occurs, the appropriate HTTP response status and message are returned.
   *
   * @param req The VoteRequest object containing the question ID and the username.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const downvoteQuestion = async (req: VoteRequest, res: Response): Promise<void> => {
    voteQuestion(req, res, 'downvote');
  };

  /**
   * Retrieves a list of questions for a specific community. The community ID is passed as a parameter.
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The CommunityQuestionsRequest object containing the community ID as a parameter.
   * @param res The HTTP response object used to send back the list of questions.
   */
  const getCommunityQuestionsRoute = async (
    req: CommunityQuestionsRequest,
    res: Response,
  ): Promise<void> => {
    const { communityId } = req.params;

    try {
      const questions = await getCommunityQuestions(communityId);

      const populatedQuestions = await Promise.all(
        questions.map(async question => {
          const populatedQuestion = await populateDocument(question._id.toString(), 'question');

          if ('error' in populatedQuestion) {
            throw new Error(populatedQuestion.error);
          }

          return populatedQuestion;
        }),
      );

      res.json(populatedQuestions);
    } catch (err: unknown) {
      res.status(500).send(`Error when fetching community questions: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves a list of questions by the title and text,
   * If there is an error, the HTTP response's status is updated.
   *
   * @param req The FindQuestionByIdRequest object containing the question ID as a parameter.
   * @param res The HTTP response object used to send back the question details.
   *
   * @returns A Promise that resolves to void.
   */
  const getQuestionsByTextAndTitle = async (
    req: FindQuestionByTitleAndText,
    res: Response,
  ): Promise<void> => {
    const { title, text } = req.query;
    try {
      const q = await fetchFiveQuestionsByTextAndTitle(title as string, text as string);
      if ('error' in q) {
        throw new Error('Error while fetching question by id');
      }

      res.json(q);
    } catch (err: unknown) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching questions by title and text: ${err.message}`);
      } else {
        res.status(500).send(`Error when fetching questions by title and text`);
      }
    }
  };

  // add appropriate HTTP verbs and their endpoints to the router
  router.get('/getQuestion', getQuestionsByFilter);
  router.get('/getQuestionById/:qid', getQuestionById);
  router.post('/addQuestion', addQuestion);
  router.post('/upvoteQuestion', upvoteQuestion);
  router.post('/downvoteQuestion', downvoteQuestion);
  router.get('/getCommunityQuestions/:communityId', getCommunityQuestionsRoute);
  router.get('/getQuestionsByTextAndTitle', getQuestionsByTextAndTitle);

  return router;
};

export default questionController;
