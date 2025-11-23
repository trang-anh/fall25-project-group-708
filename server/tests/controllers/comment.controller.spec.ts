import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';

import * as commentUtil from '../../services/comment.service';
import * as databaseUtil from '../../utils/database.util';
import * as contentModerationService from '../../services/contentModeration.service';
import * as registerPointsService from '../../services/registerPoints.service';

// SPY SETUP
const saveCommentSpy = jest.spyOn(commentUtil, 'saveComment');
const addCommentSpy = jest.spyOn(commentUtil, 'addComment');
const populateDocSpy = jest.spyOn(databaseUtil, 'populateDocument');

const moderateContentSpy = jest.spyOn(contentModerationService, 'moderateContent');
const cleanTextSpy = jest.spyOn(contentModerationService, 'cleanText');

const addRegisterPointsSpy = jest.spyOn(registerPointsService, 'default');

describe('POST /addComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================
  // 1. ADD COMMENT TO QUESTION
  // ============================
  it('should add a new comment to a question with clean content', async () => {
    const qid = new mongoose.Types.ObjectId();
    const cid = new mongoose.Types.ObjectId();

    const reqBody = {
      id: qid.toString(),
      type: 'question',
      comment: {
        text: 'This is a test comment',
        commentBy: 'user123',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: cid,
      text: 'This is a test comment',
      commentBy: 'user123',
      commentDateTime: new Date('2024-06-03'),
    };

    // NEW moderateContent return shape
    moderateContentSpy.mockReturnValueOnce({
      isHateful: false,
      detectedIn: [],
      badWords: {},
    });

    cleanTextSpy.mockReturnValueOnce('This is a test comment');

    // NEW addRegisterPoints return shape
    addRegisterPointsSpy.mockResolvedValueOnce({
      applied: 10,
      blocked: 0,
      message: 'OK',
    });

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce({
      _id: qid,
      comments: [mockComment],
    } as any);

    populateDocSpy.mockResolvedValueOnce({
      _id: qid,
      title: 'Test Question',
      text: 'Test Question',
      tags: [],
      askedBy: 'user123',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [],
      comments: [mockComment],
      community: null,
    } as any);

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      _id: cid.toString(),
      text: 'This is a test comment',
      commentBy: 'user123',
      commentDateTime: mockComment.commentDateTime.toISOString(),
    });

    expect(moderateContentSpy).toHaveBeenCalledWith({ text: 'This is a test comment' });

    expect(addRegisterPointsSpy).toHaveBeenCalledWith('user123', 10, 'ACCEPT_ANSWER');
  });

  // ============================
  // 2. ADD COMMENT TO ANSWER
  // ============================
  it('should add a new comment to an answer with clean content', async () => {
    const aid = new mongoose.Types.ObjectId();
    const cid = new mongoose.Types.ObjectId();

    const reqBody = {
      id: aid.toString(),
      type: 'answer',
      comment: {
        text: 'Nice answer!',
        commentBy: 'user123',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: cid,
      text: 'Nice answer!',
      commentBy: 'user123',
      commentDateTime: new Date('2024-06-03'),
    };

    moderateContentSpy.mockReturnValueOnce({
      isHateful: false,
      detectedIn: [],
      badWords: {},
    });

    cleanTextSpy.mockReturnValueOnce('Nice answer!');

    addRegisterPointsSpy.mockResolvedValueOnce({
      applied: 10,
      blocked: 0,
      message: 'OK',
    });

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce({
      _id: aid,
      comments: [mockComment],
    } as any);

    populateDocSpy.mockResolvedValueOnce({
      _id: aid,
      title: 'Test Question',
      text: 'Test Question',
      tags: [],
      askedBy: 'user123',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [],
      comments: [mockComment],
      community: null,
    } as any);

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(200);
    expect(addRegisterPointsSpy).toHaveBeenCalledWith('user123', 10, 'ACCEPT_ANSWER');
  });

  // ============================
  // 3. BAD WORDS CASE
  // ============================
  it('should deduct points when bad words are detected', async () => {
    const qid = new mongoose.Types.ObjectId();
    const cid = new mongoose.Types.ObjectId();

    const reqBody = {
      id: qid.toString(),
      type: 'question',
      comment: {
        text: 'you are badword idiot',
        commentBy: 'user123',
        commentDateTime: new Date('2024-06-03'),
      },
    };

    const mockComment = {
      _id: cid,
      text: 'you are ******* *****',
      commentBy: 'user123',
      commentDateTime: new Date('2024-06-03'),
    };

    moderateContentSpy.mockReturnValueOnce({
      isHateful: true,
      detectedIn: ['text'],
      badWords: {
        text: ['badword', 'idiot'],
      },
    });

    cleanTextSpy.mockReturnValueOnce('you are ******* *****');

    addRegisterPointsSpy.mockResolvedValueOnce({
      applied: -2,
      blocked: 0,
      message: 'OK',
    });

    saveCommentSpy.mockResolvedValueOnce(mockComment);
    addCommentSpy.mockResolvedValueOnce({
      _id: qid,
      comments: [mockComment],
    } as any);
    populateDocSpy.mockResolvedValueOnce({
      _id: qid,
      title: 'Test Question',
      text: 'Test Question',
      tags: [],
      askedBy: 'user123',
      askDateTime: new Date('2024-06-03'),
      views: [],
      upVotes: [],
      downVotes: [],
      answers: [],
      comments: [mockComment],
      community: null,
    } as any);

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(200);
    expect(addRegisterPointsSpy).toHaveBeenCalledWith('user123', -2, 'HATEFUL_LANGUAGE');
  });

  // =======================
  // VALIDATION ERRORS
  // =======================

  it('should return 400 if id is missing', async () => {
    const reqBody = {
      type: 'question',
      comment: {
        text: 'test',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(400);
  });

  it('should return 400 if type is missing', async () => {
    const id = new mongoose.Types.ObjectId();

    const reqBody = {
      id: id.toString(),
      comment: {
        text: 'test',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(400);
  });

  it('should return 400 if text is empty', async () => {
    const id = new mongoose.Types.ObjectId();

    const reqBody = {
      id: id.toString(),
      type: 'question',
      comment: {
        text: '',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(400);
  });

  it('should return 400 if id is invalid', async () => {
    const reqBody = {
      id: '',
      type: 'question',
      comment: {
        text: 'test',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: expect.stringContaining('Request Validation Failed'),
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: '/body/id',
          message: expect.stringContaining('object-id'),
        }),
      ]),
    });
  });

  // ============================
  // 4. INVALID ID CASE
  // ============================
  it('should return 400 if id is not a valid ObjectId', async () => {
    const reqBody = {
      id: 'not-a-valid-objectid',
      type: 'question',
      comment: {
        text: 'test',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: expect.stringContaining('Request Validation Failed'),
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: '/body/id',
          message: expect.stringContaining('object-id'),
        }),
      ]),
    });
  });

  // ===============================
  // DB ERROR CASES
  // ===============================

  it('should return 500 if saveComment fails', async () => {
    const id = new mongoose.Types.ObjectId();

    const reqBody = {
      id: id.toString(),
      type: 'question',
      comment: {
        text: 'test',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    moderateContentSpy.mockReturnValueOnce({
      isHateful: false,
      detectedIn: [],
      badWords: {},
    });

    cleanTextSpy.mockReturnValueOnce('test');

    addRegisterPointsSpy.mockResolvedValueOnce({
      applied: 10,
      blocked: 0,
      message: 'OK',
    });

    saveCommentSpy.mockResolvedValueOnce({ error: 'DB failure' });

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(500);
    expect(res.text).toBe('Error when adding comment: DB failure');
  });

  it('should return 500 if addComment fails', async () => {
    const id = new mongoose.Types.ObjectId();

    const reqBody = {
      id: id.toString(),
      type: 'question',
      comment: {
        text: 'test',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    const mockComment = {
      _id: new mongoose.Types.ObjectId(),
      text: 'test',
      commentBy: 'user',
      commentDateTime: new Date(),
    };

    moderateContentSpy.mockReturnValueOnce({
      isHateful: false,
      detectedIn: [],
      badWords: {},
    });

    cleanTextSpy.mockReturnValueOnce('test');

    addRegisterPointsSpy.mockResolvedValueOnce({
      applied: 10,
      blocked: 0,
      message: 'OK',
    });

    saveCommentSpy.mockResolvedValueOnce(mockComment);

    addCommentSpy.mockResolvedValueOnce({ error: 'Add failed' });

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(500);
    expect(res.text).toBe('Error when adding comment: Add failed');
  });

  it('should return 500 if populateDocument fails', async () => {
    const id = new mongoose.Types.ObjectId();
    const mockComment = {
      _id: new mongoose.Types.ObjectId(),
      text: 'test',
      commentBy: 'user',
      commentDateTime: new Date(),
    };

    const reqBody = {
      id: id.toString(),
      type: 'question',
      comment: {
        text: 'test',
        commentBy: 'user',
        commentDateTime: new Date(),
      },
    };

    moderateContentSpy.mockReturnValueOnce({
      isHateful: false,
      detectedIn: [],
      badWords: {},
    });

    cleanTextSpy.mockReturnValueOnce('test');

    addRegisterPointsSpy.mockResolvedValueOnce({
      applied: 10,
      blocked: 0,
      message: 'OK',
    });

    saveCommentSpy.mockResolvedValueOnce(mockComment);

    addCommentSpy.mockResolvedValueOnce({
      _id: id,
      comments: [mockComment],
    } as any);

    populateDocSpy.mockResolvedValueOnce({ error: 'Populate failed' });

    const res = await supertest(app).post('/api/comment/addComment').send(reqBody);

    expect(res.status).toBe(500);
    expect(res.text).toBe('Error when adding comment: Populate failed');
  });
});
