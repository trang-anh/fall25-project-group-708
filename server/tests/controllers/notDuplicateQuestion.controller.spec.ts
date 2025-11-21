import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';

// service spy
import saveNotDuplicateQuestion from '../../services/notDuplicateQuestion.service';
jest.mock('../../services/notDuplicateQuestion.service');

const saveNotDuplicateQuestionSpy = saveNotDuplicateQuestion as jest.Mock;
// eslint-disable-next-line @typescript-eslint/naming-convention
const api = '/api/notDuplicateQuestion/saveNotDuplicateQuestion';

describe('POST' + api, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================
  // 1. SUCCESS CASE
  // ======================
  it('should save a not duplicate question successfully', async () => {
    const qid = new mongoose.Types.ObjectId();
    const dup1 = new mongoose.Types.ObjectId();
    const dup2 = new mongoose.Types.ObjectId();
    const newId = new mongoose.Types.ObjectId();

    const reqBody = {
      username: 'harry',
      question: qid,
      duplicateOf: [dup1, dup2],
      justification: 'This is not a duplicate because it covers X.',
      createdAt: new Date('2024-06-03'),
    };

    const dbReturn = {
      _id: newId,
      ...reqBody,
    };

    // mock service success
    saveNotDuplicateQuestionSpy.mockResolvedValueOnce(dbReturn);

    const res = await supertest(app).post(api).send(reqBody);

    expect(res.status).toBe(200);
    expect(saveNotDuplicateQuestionSpy).toHaveBeenCalledWith({
      ...reqBody,
      createdAt: reqBody.createdAt.toISOString(),
      question: qid.toString(),
      duplicateOf: [dup1.toString(), dup2.toString()],
    });

    expect(res.body).toEqual({
      _id: newId.toString(),
      username: 'harry',
      question: qid.toString(),
      duplicateOf: [dup1.toString(), dup2.toString()],
      justification: reqBody.justification,
      createdAt: reqBody.createdAt.toISOString(),
    });
  });

  // ======================
  // 2. SERVICE RETURNS ERROR
  // ======================
  it('should return 500 if service returns an error', async () => {
    const qid = new mongoose.Types.ObjectId();
    const dup1 = new mongoose.Types.ObjectId();

    const reqBody = {
      username: 'harry',
      question: qid,
      duplicateOf: [dup1],
      justification: 'valid justification',
      createdAt: new Date(),
    };

    saveNotDuplicateQuestionSpy.mockResolvedValueOnce({
      error: 'Database failed',
    });

    const res = await supertest(app)
      .post('/api/notDuplicateQuestion/saveNotDuplicateQuestion')
      .send(reqBody);

    expect(res.status).toBe(500);
    expect(res.text).toBe('Error when saving not duplicate question: Database failed');
  });

  it('should return generic error message if a non-Error is thrown', async () => {
    const qid = new mongoose.Types.ObjectId();

    const reqBody = {
      username: 'harry',
      question: qid,
      duplicateOf: [],
      justification: 'test justification',
      createdAt: new Date(),
    };

    saveNotDuplicateQuestionSpy.mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 123;
    });

    const res = await supertest(app).post(api).send(reqBody);

    expect(res.status).toBe(500);
    expect(res.text).toBe('Error when saving not duplicate question');
  });

  // ======================
  // 3. OpenAPI VALIDATION ERRORS
  // ======================

  it('should fail validation if username is missing', async () => {
    const qid = new mongoose.Types.ObjectId();
    const dup1 = new mongoose.Types.ObjectId();

    const reqBody = {
      question: qid,
      duplicateOf: [dup1],
      justification: 'hi',
      createdAt: new Date(),
    };

    const res = await supertest(app).post(api).send(reqBody);

    expect(res.status).toBe(400);

    const parsed = JSON.parse(res.text);
    expect(parsed.message).toBe('Request Validation Failed');
    expect(parsed.errors[0].path).toBe('/body/username');
  });

  it('should fail validation if question is not an ObjectId', async () => {
    const reqBody = {
      username: 'harry',
      question: 'not-an-id',
      duplicateOf: [],
      justification: 'hi',
      createdAt: new Date(),
    };

    const res = await supertest(app).post(api).send(reqBody);

    expect(res.status).toBe(400);

    const parsed = JSON.parse(res.text);
    expect(parsed.errors[0].path).toBe('/body/question');
    expect(parsed.errors[0].message).toContain('format');
  });

  it('should fail validation if duplicateOf is not an array of ObjectIds', async () => {
    const qid = new mongoose.Types.ObjectId();

    const reqBody = {
      username: 'harry',
      question: qid,
      duplicateOf: ['not-object-id'],
      justification: 'hi',
      createdAt: new Date(),
    };

    const res = await supertest(app).post(api).send(reqBody);

    expect(res.status).toBe(400);

    const parsed = JSON.parse(res.text);
    expect(parsed.errors[0].path).toContain('/body/duplicateOf');
  });

  it('should fail validation if justification is missing', async () => {
    const qid = new mongoose.Types.ObjectId();

    const reqBody = {
      username: 'harry',
      question: qid,
      duplicateOf: [],
      createdAt: new Date(),
    };

    const res = await supertest(app).post(api).send(reqBody);

    expect(res.status).toBe(400);

    const parsed = JSON.parse(res.text);
    expect(parsed.errors[0].path).toBe('/body/justification');
  });

  it('should fail validation if createdAt is missing', async () => {
    const qid = new mongoose.Types.ObjectId();

    const reqBody = {
      username: 'harry',
      question: qid,
      duplicateOf: [],
      justification: 'hi',
    };

    const res = await supertest(app).post(api).send(reqBody);

    expect(res.status).toBe(400);

    const parsed = JSON.parse(res.text);
    expect(parsed.errors[0].path).toBe('/body/createdAt');
  });
});
