import { populateDocument } from '../../utils/database.util';

import mongoose from 'mongoose';
import QuestionModel from '../../models/questions.model';
import AnswerModel from '../../models/answers.model';
import ChatModel from '../../models/chat.model';
import CollectionModel from '../../models/collection.model';
import UserModel from '../../models/users.model';

import { PopulatedDatabaseChat, PopulatedDatabaseCollection } from '../../types/types';

jest.mock('../../models/questions.model');
jest.mock('../../models/answers.model');
jest.mock('../../models/chat.model');
jest.mock('../../models/collection.model');
jest.mock('../../models/users.model');

describe('populateDocument', () => {
  beforeEach(() => jest.resetAllMocks());

  //  QUESTION
  it('populates a question successfully', async () => {
    const questionId = new mongoose.Types.ObjectId().toString();

    (QuestionModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: questionId,
        title: 'Test Question',
      }),
    });

    const result = await populateDocument(questionId, 'question');
    expect(result).toHaveProperty('_id', questionId);
  });

  //  ANSWER
  it('populates an answer successfully', async () => {
    const answerId = new mongoose.Types.ObjectId().toString();

    (AnswerModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: answerId,
        text: 'Answer text',
      }),
    });

    const result = await populateDocument(answerId, 'answer');
    expect(result).toHaveProperty('_id', answerId);
  });

  //  CHAT
  it('populates a chat successfully', async () => {
    const chatId = 'chat-1';

    const message1 = {
      _id: new mongoose.Types.ObjectId(),
      msg: 'hi',
      msgFrom: 'user1',
      msgDateTime: new Date(),
      type: 'global',
    };

    const message2 = {
      _id: new mongoose.Types.ObjectId(),
      msg: 'bye',
      msgFrom: 'user2',
      msgDateTime: new Date(),
      type: 'global',
    };

    const chatDoc = {
      _id: chatId,
      messages: [message1, message2],
      participants: ['user1', 'user2'],
      toObject: jest.fn().mockReturnValue({
        _id: chatId,
        messages: [message1, message2],
        participants: ['user1', 'user2'],
      }),
    };

    (ChatModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(chatDoc),
    });

    (UserModel.find as jest.Mock).mockResolvedValue([
      { _id: new mongoose.Types.ObjectId(), username: 'user1', avatarUrl: 'avatar1' },
      { _id: new mongoose.Types.ObjectId(), username: 'user2', avatarUrl: null },
    ]);

    const result = (await populateDocument(chatId, 'chat')) as PopulatedDatabaseChat;

    expect(result).toBeDefined();
  });

  it('throws error if chat not found', async () => {
    (ChatModel.findOne as jest.Mock).mockResolvedValue(null);
    const result = await populateDocument('missing-chat', 'chat');
    expect(result).toHaveProperty('error');
  });

  //  COLLECTION
  it('populates a collection successfully', async () => {
    const colId = new mongoose.Types.ObjectId().toString();
    const q1 = new mongoose.Types.ObjectId().toString();
    const q2 = new mongoose.Types.ObjectId().toString();

    const collectionDoc = {
      _id: colId,
      questions: [q1, q2],
      toObject: jest.fn().mockReturnValue({ _id: colId, questions: [] }),
      populate: jest.fn(),
    };

    (CollectionModel.findOne as jest.Mock).mockResolvedValue(collectionDoc);

    (QuestionModel.findOne as jest.Mock).mockImplementation(({ _id }) => ({
      populate: jest.fn().mockResolvedValue({ _id, title: `Question ${_id}` }),
    }));

    const result = (await populateDocument(colId, 'collection')) as PopulatedDatabaseCollection;
    expect(result.questions.length).toBe(2);
  });

  it('throws error if a question in collection not found', async () => {
    const colId = new mongoose.Types.ObjectId().toString();
    const missingId = new mongoose.Types.ObjectId().toString();

    const collectionDoc = {
      _id: colId,
      questions: [missingId],
      toObject: jest.fn().mockReturnValue({ _id: colId, questions: [] }),
    };

    (CollectionModel.findOne as jest.Mock).mockResolvedValue(collectionDoc);
    (QuestionModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const result = await populateDocument(colId, 'collection');
    expect(result).toHaveProperty('error');
  });

  //  ERRORS
  it('returns error if id is undefined', async () => {
    const result = await populateDocument(undefined as any, 'question');
    expect(result).toHaveProperty('error');
  });

  it('returns error if invalid type is given', async () => {
    const result = await populateDocument('some-id', 'invalid' as any);
    expect(result).toHaveProperty('error');
  });

  it('returns error if question not found', async () => {
    (QuestionModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    const result = await populateDocument('missing', 'question');
    expect(result).toHaveProperty('error');
  });

  it('returns error if answer not found', async () => {
    (AnswerModel.findOne as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    const result = await populateDocument('missing-answer', 'answer');
    expect(result).toHaveProperty('error');
  });
});
