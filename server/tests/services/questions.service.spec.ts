jest.mock('../../models/questions.model');

import mongoose, { Query } from 'mongoose';
import QuestionModel from '../../models/questions.model';
import {
  filterQuestionsBySearch,
  filterQuestionsByAskedBy,
  getQuestionsByOrder,
  fetchAndIncrementQuestionViewsById,
  saveQuestion,
  addVoteToQuestion,
  getCommunityQuestions,
  fetchFiveQuestionsByTextAndTitle,
} from '../../services/question.service';
import { DatabaseQuestion, PopulatedDatabaseQuestion } from '../../types/types';
import {
  QUESTIONS,
  tag1,
  tag2,
  ans1,
  ans2,
  ans3,
  ans4,
  POPULATED_QUESTIONS,
} from '../mockData.models';
import * as registerPointsService from '../../services/registerPoints.service';

describe('Question model', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(registerPointsService, 'hasReceivedUpvotePoints').mockResolvedValue(false);
    jest.spyOn(registerPointsService, 'hasReceivedDownvotePenalty').mockResolvedValue(false);

    jest.spyOn(registerPointsService, 'default').mockResolvedValue({
      applied: 2,
      blocked: 0,
      entry: {} as any,
    });
  });

  describe('filterQuestionsBySearch', () => {
    test('filter questions with empty search string should return all questions', () => {
      const result = filterQuestionsBySearch(POPULATED_QUESTIONS, '');

      expect(result.length).toEqual(POPULATED_QUESTIONS.length);
    });

    test('filter questions with empty list of questions should return empty list', () => {
      const result = filterQuestionsBySearch([], 'react');

      expect(result.length).toEqual(0);
    });

    test('filter questions with empty questions and empty string should return empty list', () => {
      const result = filterQuestionsBySearch([], '');

      expect(result.length).toEqual(0);
    });

    test('filter question by one tag', () => {
      const result = filterQuestionsBySearch(POPULATED_QUESTIONS, '[android]');

      expect(result.length).toEqual(1);
      expect(result[0]._id.toString()).toEqual('65e9b58910afe6e94fc6e6dc');
    });

    test('filter question by multiple tags', () => {
      const result = filterQuestionsBySearch(POPULATED_QUESTIONS, '[android] [react]');

      expect(result.length).toEqual(2);
      expect(result[0]._id.toString()).toEqual('65e9b58910afe6e94fc6e6dc');
      expect(result[1]._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
    });

    test('filter question by one user', () => {
      const result = filterQuestionsByAskedBy(POPULATED_QUESTIONS, 'q_by4');

      expect(result.length).toEqual(1);
      expect(result[0]._id.toString()).toEqual('65e9b716ff0e892116b2de09');
    });

    test('filter question by tag and then by user', () => {
      let result = filterQuestionsBySearch(POPULATED_QUESTIONS, '[javascript]');
      result = filterQuestionsByAskedBy(result, 'q_by2');

      expect(result.length).toEqual(1);
      expect(result[0]._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
    });

    test('filter question by one keyword', () => {
      const result = filterQuestionsBySearch(POPULATED_QUESTIONS, 'website');

      expect(result.length).toEqual(1);
      expect(result[0]._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
    });

    test('filter question by tag and keyword', () => {
      const result = filterQuestionsBySearch(POPULATED_QUESTIONS, 'website [android]');

      expect(result.length).toEqual(2);
      expect(result[0]._id.toString()).toEqual('65e9b58910afe6e94fc6e6dc');
      expect(result[1]._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
    });
  });

  describe('getQuestionsByOrder', () => {
    test('get active questions, newest questions sorted by most recently answered 1', async () => {
      const mockQuestionsFromDb = POPULATED_QUESTIONS.slice(0, 3);

      // Mock the find method and the chaining of populate
      // The type cast to unkown and then to Query is necessary to ensure that typechecking is performed after the mock
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuestionsFromDb),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = await getQuestionsByOrder('active');

      expect(result.length).toEqual(3);
      expect(result[0]._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
      expect(result[1]._id.toString()).toEqual('65e9b58910afe6e94fc6e6dc');
      expect(result[2]._id.toString()).toEqual('65e9b9b44c052f0a08ecade0');
    });

    test('get active questions, newest questions sorted by most recently answered 2', async () => {
      const questions = [
        {
          _id: '65e9b716ff0e892116b2de01',
          answers: [ans1, ans3], // 18, 19 => 19
          askDateTime: new Date('2023-11-20T09:24:00'),
        },
        {
          _id: '65e9b716ff0e892116b2de02',
          answers: [ans1, ans2, ans3, ans4], // 18, 20, 19, 19 => 20
          askDateTime: new Date('2023-11-20T09:24:00'),
        },
        {
          _id: '65e9b716ff0e892116b2de03',
          answers: [ans1], // 18 => 18
          askDateTime: new Date('2023-11-19T09:24:00'),
        },
        {
          _id: '65e9b716ff0e892116b2de04',
          answers: [ans4], // 19 => 19
          askDateTime: new Date('2023-11-21T09:24:00'),
        },
        {
          _id: '65e9b716ff0e892116b2de05',
          answers: [],
          askDateTime: new Date('2023-11-19T10:24:00'),
        },
      ];

      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(questions),
      } as unknown as Query<Partial<PopulatedDatabaseQuestion>[], typeof QuestionModel>);

      const result = await getQuestionsByOrder('active');

      expect(result.length).toEqual(5);
      expect(result[0]._id.toString()).toEqual('65e9b716ff0e892116b2de02');
      expect(result[1]._id.toString()).toEqual('65e9b716ff0e892116b2de04');
      expect(result[2]._id.toString()).toEqual('65e9b716ff0e892116b2de01');
      expect(result[3]._id.toString()).toEqual('65e9b716ff0e892116b2de03');
      expect(result[4]._id.toString()).toEqual('65e9b716ff0e892116b2de05');
    });

    test('get newest unanswered questions', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(POPULATED_QUESTIONS),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = await getQuestionsByOrder('unanswered');

      expect(result.length).toEqual(2);
      expect(result[0]._id.toString()).toEqual('65e9b716ff0e892116b2de09');
      expect(result[1]._id.toString()).toEqual('65e9b9b44c052f0a08ecade0');
    });

    test('get newest questions', async () => {
      const questions = [
        {
          _id: '65e9b716ff0e892116b2de01',
          askDateTime: new Date('2023-11-20T09:24:00'),
        },
        {
          _id: '65e9b716ff0e892116b2de04',
          askDateTime: new Date('2023-11-21T09:24:00'),
        },
        {
          _id: '65e9b716ff0e892116b2de05',
          askDateTime: new Date('2023-11-19T10:24:00'),
        },
      ];
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(questions),
      } as unknown as Query<Partial<PopulatedDatabaseQuestion>[], typeof QuestionModel>);

      const result = await getQuestionsByOrder('newest');

      expect(result.length).toEqual(3);
      expect(result[0]._id.toString()).toEqual('65e9b716ff0e892116b2de04');
      expect(result[1]._id.toString()).toEqual('65e9b716ff0e892116b2de01');
      expect(result[2]._id.toString()).toEqual('65e9b716ff0e892116b2de05');
    });

    test('get newest most viewed questions', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(POPULATED_QUESTIONS),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = await getQuestionsByOrder('mostViewed');

      expect(result.length).toEqual(4);
      expect(result[0]._id.toString()).toEqual('65e9b9b44c052f0a08ecade0');
      expect(result[1]._id.toString()).toEqual('65e9b58910afe6e94fc6e6dc');
      expect(result[2]._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
      expect(result[3]._id.toString()).toEqual('65e9b716ff0e892116b2de09');
    });

    test('getQuestionsByOrder should return empty list if find throws an error', async () => {
      jest.spyOn(QuestionModel, 'find').mockImplementation(() => {
        throw new Error('error');
      });

      const result = await getQuestionsByOrder('newest');

      expect(result.length).toEqual(0);
    });

    test('getQuestionsByOrder should return empty list if find returns null', async () => {
      jest.spyOn(QuestionModel, 'find').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = await getQuestionsByOrder('newest');

      expect(result.length).toEqual(0);
    });
  });

  describe('service to view a question by id also increments the view count by 1', () => {
    test('fetchAndIncrementQuestionViewsById should return question and add the user to the list of views if new', async () => {
      const question = POPULATED_QUESTIONS.filter(
        q => q._id && q._id.toString() === '65e9b5a995b6c7045a30d823',
      )[0];

      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest
          .fn()
          .mockResolvedValue({ ...question, views: ['question1_user', ...question.views] }),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = (await fetchAndIncrementQuestionViewsById(
        '65e9b5a995b6c7045a30d823',
        'question1_user',
      )) as PopulatedDatabaseQuestion;

      expect(result.views.length).toEqual(2);
      expect(result.views).toEqual(['question1_user', 'question2_user']);
      expect(result._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
      expect(result.title).toEqual(question.title);
      expect(result.text).toEqual(question.text);
      expect(result.answers).toEqual(question.answers);
      expect(result.askDateTime).toEqual(question.askDateTime);
    });

    test('fetchAndIncrementQuestionViewsById should return question and not add the user to the list of views if already viewed by them', async () => {
      const question = QUESTIONS.filter(
        q => q._id && q._id.toString() === '65e9b5a995b6c7045a30d823',
      )[0];
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(question),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = (await fetchAndIncrementQuestionViewsById(
        '65e9b5a995b6c7045a30d823',
        'question2_user',
      )) as PopulatedDatabaseQuestion;

      expect(result.views.length).toEqual(1);
      expect(result.views).toEqual(['question2_user']);
      expect(result._id.toString()).toEqual('65e9b5a995b6c7045a30d823');
      expect(result.title).toEqual(question.title);
      expect(result.text).toEqual(question.text);
      expect(result.answers).toEqual(question.answers);
      expect(result.askDateTime).toEqual(question.askDateTime);
    });

    test('fetchAndIncrementQuestionViewsById should return an error if id does not exist', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = await fetchAndIncrementQuestionViewsById(
        '65e9b716ff0e892116b2de01',
        'question1_user',
      );

      expect(result).toEqual({ error: 'Error when fetching and updating a question' });
    });

    test('fetchAndIncrementQuestionViewsById should return an object with error if findOneAndUpdate throws an error', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error')),
      } as unknown as Query<PopulatedDatabaseQuestion[], typeof QuestionModel>);

      const result = (await fetchAndIncrementQuestionViewsById(
        '65e9b716ff0e892116b2de01',
        'question2_user',
      )) as {
        error: string;
      };

      expect(result.error).toEqual('Error when fetching and updating a question');
    });
  });

  describe('service to save a new question in the database', () => {
    test('saveQuestion should return the saved question', async () => {
      const mockQn = {
        title: 'New Question Title',
        text: 'New Question Text',
        tags: [tag1._id, tag2._id],
        askedBy: 'question3_user',
        askDateTime: new Date('2024-06-06'),
        answers: [],
        views: [],
        upVotes: [],
        downVotes: [],
        comments: [],
        community: null,
      };

      jest
        .spyOn(QuestionModel, 'create')
        .mockResolvedValue({ ...mockQn, _id: mongoose.Types.ObjectId } as unknown as ReturnType<
          typeof QuestionModel.create<DatabaseQuestion>
        >);
      const result = (await saveQuestion(mockQn)) as DatabaseQuestion;

      expect(result._id).toBeDefined();
      expect(result.title).toEqual(mockQn.title);
      expect(result.text).toEqual(mockQn.text);
      expect(result.tags[0]._id.toString()).toEqual(tag1._id.toString());
      expect(result.tags[1]._id.toString()).toEqual(tag2._id.toString());
      expect(result.askedBy).toEqual(mockQn.askedBy);
      expect(result.askDateTime).toEqual(mockQn.askDateTime);
      expect(result.views).toEqual([]);
      expect(result.answers.length).toEqual(0);
    });

    test('saveQuestion should return error when unable to save question', async () => {
      const mockQn = {
        title: 'New Question Title',
        text: 'New Question Text',
        tags: [tag1._id, tag2._id],
        askedBy: 'question3_user',
        askDateTime: new Date('2024-06-06'),
        answers: [],
        views: [],
        upVotes: [],
        downVotes: [],
        comments: [],
        community: null,
      };

      jest
        .spyOn(QuestionModel, 'create')
        .mockRejectedValue({ error: 'Unable to save question' } as unknown as ReturnType<
          typeof QuestionModel.create<DatabaseQuestion>
        >);
      const result = (await saveQuestion(mockQn)) as DatabaseQuestion;

      expect(result).toEqual({ error: 'Error when saving a question' });
    });
  });

  describe('addVoteToQuestion', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      jest.spyOn(registerPointsService, 'hasReceivedUpvotePoints').mockResolvedValue(false);
      jest.spyOn(registerPointsService, 'hasReceivedDownvotePenalty').mockResolvedValue(false);

      jest.spyOn(registerPointsService, 'default').mockResolvedValue({
        applied: 2,
        blocked: 0,
        entry: {} as any, // mock Document
      });
    });

    test('adds an upvote when user has not upvoted before', async () => {
      const mockQuestion = {
        _id: 'someQuestionId',
        askedBy: 'authorUser',
        upVotes: [],
        downVotes: [],
      };

      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockResolvedValue({ ...mockQuestion, upVotes: ['testUser'], downVotes: [] });

      const result = await addVoteToQuestion('someQuestionId', 'testUser', 'upvote');

      expect(result).toEqual({
        msg: 'Question upvoted successfully',
        upVotes: ['testUser'],
        downVotes: [],
      });

      // ensure points awarded
      expect(registerPointsService.default).toHaveBeenCalledWith(
        'testUser',
        2,
        'UPVOTE_OTHERS',
        'someQuestionId',
      );
    });

    test('cancels an upvote when already upvoted', async () => {
      const mockQuestion = {
        _id: 'someQuestionId',
        askedBy: 'authorUser',
        upVotes: ['testUser'],
        downVotes: [],
      };

      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockResolvedValue({ ...mockQuestion, upVotes: [], downVotes: [] });

      const result = await addVoteToQuestion('someQuestionId', 'testUser', 'upvote');

      expect(result).toEqual({
        msg: 'Upvote cancelled successfully',
        upVotes: [],
        downVotes: [],
      });

      // ensure NO points added
      expect(registerPointsService.default).not.toHaveBeenCalled();
    });

    test('adds a downvote when user has not downvoted before', async () => {
      const mockQuestion = {
        _id: 'someQuestionId',
        askedBy: 'authorUser',
        upVotes: [],
        downVotes: [],
      };

      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockResolvedValue({ ...mockQuestion, upVotes: [], downVotes: ['testUser'] });

      const result = await addVoteToQuestion('someQuestionId', 'testUser', 'downvote');

      expect(result).toEqual({
        msg: 'Question downvoted successfully',
        upVotes: [],
        downVotes: ['testUser'],
      });

      // ensure penalty to author
      expect(registerPointsService.default).toHaveBeenCalledWith(
        'authorUser',
        -1,
        'RECEIVE_DOWNVOTES',
        'someQuestionId',
      );
    });

    test('cancels a downvote when already downvoted', async () => {
      const mockQuestion = {
        _id: 'someQuestionId',
        askedBy: 'authorUser',
        upVotes: [],
        downVotes: ['testUser'],
      };

      jest
        .spyOn(QuestionModel, 'findOneAndUpdate')
        .mockResolvedValue({ ...mockQuestion, upVotes: [], downVotes: [] });

      const result = await addVoteToQuestion('someQuestionId', 'testUser', 'downvote');

      expect(result).toEqual({
        msg: 'Downvote cancelled successfully',
        upVotes: [],
        downVotes: [],
      });

      // ensure NO penalty removed or added
      expect(registerPointsService.default).not.toHaveBeenCalled();
    });

    test('switch from upvote → downvote', async () => {
      const mockQuestion = {
        _id: 'someQuestionId',
        askedBy: 'authorUser',
        upVotes: ['testUser'],
        downVotes: [],
      };

      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValue({
        ...mockQuestion,
        upVotes: [],
        downVotes: ['testUser'],
      });

      const result = await addVoteToQuestion('someQuestionId', 'testUser', 'downvote');

      expect(result).toEqual({
        msg: 'Question downvoted successfully',
        upVotes: [],
        downVotes: ['testUser'],
      });

      expect(registerPointsService.default).toHaveBeenCalled();
    });

    test('returns error if question does not exist', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockResolvedValue(null);

      const result = await addVoteToQuestion('badId', 'testUser', 'upvote');

      expect(result).toEqual({ error: 'Question not found!' });
    });

    test('returns error if DB update fails', async () => {
      jest.spyOn(QuestionModel, 'findOneAndUpdate').mockRejectedValue(new Error('DB error'));

      const result = await addVoteToQuestion('id', 'testUser', 'upvote');

      expect(result).toEqual({ error: 'Error when adding upvote to question' });
    });
  });

  describe('getCommunityQuestions', () => {
    const mockCommunityDatabaseQuestion: DatabaseQuestion = {
      _id: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6fe'),
      title: 'New Question Title',
      text: 'New Question Text',
      tags: [tag1._id, tag2._id],
      answers: [],
      askedBy: 'question3_user',
      askDateTime: new Date('2024-06-05'),
      views: [],
      upVotes: [],
      downVotes: [],
      comments: [],
      community: new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6f1'),
    };
    test('getCommunityQuestions should return questions for a given community', async () => {
      jest
        .spyOn(QuestionModel, 'find')
        .mockResolvedValue([mockCommunityDatabaseQuestion] as unknown as DatabaseQuestion[]);

      const result = await getCommunityQuestions('65e9b58910afe6e94fc6e6f1');

      expect(result.length).toEqual(1);
      expect(result[0]._id.toString()).toEqual(mockCommunityDatabaseQuestion._id.toString());
      jest.clearAllMocks();
    });

    test('getCommunityQuestions should return an empty array if no questions are found', async () => {
      jest.spyOn(QuestionModel, 'find').mockResolvedValue([]);

      const result = await getCommunityQuestions('65e9b58910afe6e94fc6e6a2');

      expect(result.length).toEqual(0);
    });

    test("getCommunityQuestions should return an empty array if there's an error", async () => {
      jest.spyOn(QuestionModel, 'find').mockRejectedValue(new Error('Database error'));

      const result = await getCommunityQuestions('65e9b58910afe6e94fc6e6a2');

      expect(result.length).toEqual(0);
    });
  });

  describe('fetchFiveQuestionsByTextAndTitle', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns empty array when both title and text are empty', async () => {
      const result = await fetchFiveQuestionsByTextAndTitle('', '');
      expect(result).toEqual([]);
      expect(QuestionModel.find).not.toHaveBeenCalled();
    });

    test('calls QuestionModel.find() with correct regex for title only', async () => {
      const execMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ limit: limitMock });

      (QuestionModel.find as jest.Mock).mockReturnValue({ populate: populateMock });

      await fetchFiveQuestionsByTextAndTitle('react component', '');

      expect(QuestionModel.find).toHaveBeenCalledTimes(1);

      const queryArg = (QuestionModel.find as jest.Mock).mock.calls[0][0];

      const expectedRegex = new RegExp('react component', 'i');

      expect(queryArg.$or[0].title.$regex).toEqual(expectedRegex);
      expect(populateMock).toHaveBeenCalled();
      expect(limitMock).toHaveBeenCalledWith(5);
      expect(execMock).toHaveBeenCalled();
    });

    test('calls QuestionModel.find() with correct regex for text only', async () => {
      const execMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ limit: limitMock });

      (QuestionModel.find as jest.Mock).mockReturnValue({ populate: populateMock });

      await fetchFiveQuestionsByTextAndTitle('', 'how to build api');

      const queryArg = (QuestionModel.find as jest.Mock).mock.calls[0][0];

      const expectedRegex = new RegExp('how to build api', 'i');

      expect(queryArg.$or[0].text.$regex).toEqual(expectedRegex);
      expect(limitMock).toHaveBeenCalledWith(5);
      expect(execMock).toHaveBeenCalled();
    });

    test('returns populated questions when query succeeds', async () => {
      const mockQuestions: PopulatedDatabaseQuestion[] = [
        { _id: '1', title: 'Test', text: 'Body' } as any,
        { _id: '2', title: 'Another', text: 'More' } as any,
      ];

      const execMock = jest.fn().mockResolvedValue(mockQuestions);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ limit: limitMock });

      (QuestionModel.find as jest.Mock).mockReturnValue({ populate: populateMock });

      const result = await fetchFiveQuestionsByTextAndTitle('abc', 'xyz');

      expect(result).toEqual(mockQuestions);
      expect(populateMock).toHaveBeenCalled();
      expect(limitMock).toHaveBeenCalledWith(5);
      expect(execMock).toHaveBeenCalled();
    });

    test('returns empty array if .exec() throws error', async () => {
      const execMock = jest.fn().mockRejectedValue(new Error('Database error'));
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const populateMock = jest.fn().mockReturnValue({ limit: limitMock });

      (QuestionModel.find as jest.Mock).mockReturnValue({ populate: populateMock });

      const result = await fetchFiveQuestionsByTextAndTitle('title', 'text');

      expect(result).toEqual([]);
      expect(execMock).toHaveBeenCalled();
    });

    test('returns empty array if QuestionModel.find() throws error', async () => {
      (QuestionModel.find as jest.Mock).mockImplementation(() => {
        throw new Error('boom');
      });

      const result = await fetchFiveQuestionsByTextAndTitle('hello', 'world');

      expect(result).toEqual([]);
    });
  });
});
