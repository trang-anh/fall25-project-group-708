import supertest from 'supertest';
import { ObjectId } from 'mongodb';
import { app } from '../../app';

// SERVICE SPIES (REAL SPIES)
import * as answerUtil from '../../services/answer.service';
import * as databaseUtil from '../../utils/database.util';

// SPY ON REAL ANSWER + POPULATE
const saveAnswerSpy = jest.spyOn(answerUtil, 'saveAnswer');
const addAnswerToQuestionSpy = jest.spyOn(answerUtil, 'addAnswerToQuestion');
const popDocSpy = jest.spyOn(databaseUtil, 'populateDocument');

// MOCKED MODULES
jest.mock('../../services/contentModeration.service', () => ({
  moderateContent: jest.fn().mockReturnValue({
    isHateful: false,
    detectedIn: [],
    badWords: {},
  }),
  cleanText: jest.fn().mockImplementation(t => t),
}));

jest.mock('../../services/registerPoints.service', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    applied: 10,
    blocked: 0,
  }),
}));

// Import the mocks AFTER mock() so the replaced module is loaded
import * as moderationUtil from '../../services/contentModeration.service';
import addRegisterPoints from '../../services/registerPoints.service';

describe('POST /addAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================
  // 1. SUCCESS CASE
  // =========================================
  it('should add a new answer to the question', async () => {
    const validQid = new ObjectId().toString();
    const answerId = new ObjectId();

    const reqBody = {
      qid: validQid,
      ans: {
        text: 'This is a test answer',
        ansBy: 'user123',
        ansDateTime: new Date('2024-06-03'),
        comments: [],
      },
    };

    const savedAnswer = {
      _id: answerId,
      text: reqBody.ans.text,
      ansBy: reqBody.ans.ansBy,
      ansDateTime: reqBody.ans.ansDateTime,
      comments: [],
    };

    // mock moderation (clean)
    (moderationUtil.moderateContent as jest.Mock).mockReturnValueOnce({
      isHateful: false,
      detectedIn: [],
      badWords: {},
    });

    (moderationUtil.cleanText as jest.Mock).mockReturnValueOnce(reqBody.ans.text);

    (addRegisterPoints as jest.Mock).mockResolvedValueOnce({
      applied: 10,
      blocked: 0,
      message: 'OK',
    });

    saveAnswerSpy.mockResolvedValueOnce(savedAnswer);

    addAnswerToQuestionSpy.mockResolvedValueOnce({
      _id: new ObjectId(),
      title: 'mock question',
      text: 'mock',
      tags: [],
      askedBy: 'user123',
      askDateTime: new Date(),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [savedAnswer._id],
      comments: [],
      community: null,
    });

    popDocSpy.mockResolvedValueOnce({
      _id: savedAnswer._id,
      text: savedAnswer.text,
      ansBy: savedAnswer.ansBy,
      ansDateTime: savedAnswer.ansDateTime,
      comments: [],
    });

    const res = await supertest(app).post('/api/answer/addAnswer').send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      _id: answerId.toString(),
      text: savedAnswer.text,
      ansBy: savedAnswer.ansBy,
      ansDateTime: savedAnswer.ansDateTime.toISOString(),
      comments: [],
    });
  });

  // =========================================
  // 2. MISSING TEXT (OpenAPI)
  // =========================================
  it('should return 400 if answer text is missing', async () => {
    const reqBody = {
      qid: new ObjectId().toString(),
      ans: {
        ansBy: 'user123',
        ansDateTime: new Date(),
        comments: [],
      },
    };

    const res = await supertest(app).post('/api/answer/addAnswer').send(reqBody);

    expect(res.status).toBe(400);

    const parsed = JSON.parse(res.text);
    expect(parsed.errors[0].path).toBe('/body/ans/text');
  });

  // =========================================
  // 3. MISSING qid
  // =========================================
  it('should return 400 if qid is missing', async () => {
    const reqBody = {
      ans: {
        text: 'hi',
        ansBy: 'user123',
        ansDateTime: new Date(),
        comments: [],
      },
    };

    const res = await supertest(app).post('/api/answer/addAnswer').send(reqBody);

    expect(res.status).toBe(400);
  });

  // =========================================
  // 4. MISSING ansBy
  // =========================================
  it('should return 400 if ansBy is missing', async () => {
    const reqBody = {
      qid: new ObjectId().toString(),
      ans: {
        text: 'hi',
        ansDateTime: new Date(),
        comments: [],
      },
    };

    const res = await supertest(app).post('/api/answer/addAnswer').send(reqBody);

    expect(res.status).toBe(400);
  });

  // =========================================
  // 5. MISSING ansDateTime
  // =========================================
  it('should return 400 if ansDateTime is missing', async () => {
    const reqBody = {
      qid: new ObjectId().toString(),
      ans: {
        text: 'hi',
        ansBy: 'user123',
        comments: [],
      },
    };

    const res = await supertest(app).post('/api/answer/addAnswer').send(reqBody);

    expect(res.status).toBe(400);
  });

  // =========================================
  // 6. saveAnswer error
  // =========================================
  it('should return 500 if saveAnswer returns error', async () => {
    const qid = new ObjectId().toString();

    saveAnswerSpy.mockResolvedValueOnce({ error: 'Save failed' });

    const res = await supertest(app)
      .post('/api/answer/addAnswer')
      .send({
        qid,
        ans: {
          text: 'test',
          ansBy: 'user123',
          ansDateTime: new Date(),
          comments: [],
        },
      });

    expect(res.status).toBe(500);
    expect(res.text).toContain('Save failed');
  });

  // =========================================
  // 7. addAnswerToQuestion error
  // =========================================
  it('should return 500 if addAnswerToQuestion fails', async () => {
    const qid = new ObjectId().toString();

    const stored = {
      _id: new ObjectId(),
      text: 'test',
      ansBy: 'user123',
      ansDateTime: new Date(),
      comments: [],
    };

    saveAnswerSpy.mockResolvedValueOnce(stored);
    addAnswerToQuestionSpy.mockResolvedValueOnce({ error: 'Update failed' });

    const res = await supertest(app).post('/api/answer/addAnswer').send({
      qid,
      ans: stored,
    });

    expect(res.status).toBe(500);
    expect(res.text).toContain('Update failed');
  });

  // =========================================
  // 8. populateDocument error
  // =========================================
  it('should return 500 if populateDocument fails', async () => {
    const qid = new ObjectId().toString();

    const stored = {
      _id: new ObjectId(),
      text: 'test',
      ansBy: 'user123',
      ansDateTime: new Date(),
      comments: [],
    };

    const question = {
      _id: new ObjectId(),
      title: 'Test',
      text: 'Test',
      tags: [],
      askedBy: 'user123',
      askDateTime: new Date(),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [stored._id],
      comments: [],
      community: null,
    };

    saveAnswerSpy.mockResolvedValueOnce(stored);
    addAnswerToQuestionSpy.mockResolvedValueOnce(question);
    popDocSpy.mockResolvedValueOnce({ error: 'Populate failed' });

    const res = await supertest(app).post('/api/answer/addAnswer').send({
      qid,
      ans: stored,
    });

    expect(res.status).toBe(500);
    expect(res.text).toContain('Populate failed');
  });

  it('should award +10 ACCEPT_ANSWER points when no bad words are detected', async () => {
    const qid = new ObjectId().toString();

    const stored = {
      _id: new ObjectId(),
      text: 'Clean answer',
      ansBy: 'user123',
      ansDateTime: new Date(),
      comments: [],
    };

    // No bad words
    (moderationUtil.moderateContent as jest.Mock).mockReturnValueOnce({
      isHateful: false,
      detectedIn: [],
      badWords: {}, // critical
    });

    (moderationUtil.cleanText as jest.Mock).mockReturnValueOnce('Clean answer');

    // Expect +10 points
    (addRegisterPoints as jest.Mock).mockResolvedValueOnce({
      applied: 10,
      blocked: 0,
    });

    saveAnswerSpy.mockResolvedValueOnce(stored);
    addAnswerToQuestionSpy.mockResolvedValueOnce({
      _id: new ObjectId(),
      title: 'Q',
      text: 'Q',
      tags: [],
      askedBy: 'user123',
      askDateTime: new Date(),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [stored._id],
      comments: [],
      community: null,
    });

    popDocSpy.mockResolvedValueOnce(stored);

    const res = await supertest(app).post('/api/answer/addAnswer').send({
      qid,
      ans: stored,
    });

    expect(res.status).toBe(200);
    expect(addRegisterPoints).toHaveBeenCalledWith('user123', 10, 'ACCEPT_ANSWER');
  });
  it('should deduct points and use HATEFUL_LANGUAGE when bad words are detected', async () => {
    const qid = new ObjectId().toString();

    const stored = {
      _id: new ObjectId(),
      text: 'This is badword stupid',
      ansBy: 'user123',
      ansDateTime: new Date(),
      comments: [],
    };

    // Simulate 2 bad words → totalBadWords = 2 → −2 points
    (moderationUtil.moderateContent as jest.Mock).mockReturnValueOnce({
      isHateful: true,
      detectedIn: ['text'],
      badWords: {
        text: ['badword', 'stupid'],
      },
    });

    (moderationUtil.cleanText as jest.Mock).mockReturnValueOnce('This is ******* ******');

    // Expect −2 points because 2 bad words
    (addRegisterPoints as jest.Mock).mockResolvedValueOnce({
      applied: -2,
      blocked: 0,
    });

    saveAnswerSpy.mockResolvedValueOnce(stored);
    addAnswerToQuestionSpy.mockResolvedValueOnce({
      _id: new ObjectId(),
      title: 'Q',
      text: 'Q',
      tags: [],
      askedBy: 'user123',
      askDateTime: new Date(),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [stored._id],
      comments: [],
      community: null,
    });

    popDocSpy.mockResolvedValueOnce(stored);

    const res = await supertest(app).post('/api/answer/addAnswer').send({
      qid,
      ans: stored,
    });

    expect(res.status).toBe(200);
    expect(addRegisterPoints).toHaveBeenCalledWith('user123', -2, 'HATEFUL_LANGUAGE');
  });
});
