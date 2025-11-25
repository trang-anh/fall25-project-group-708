import supertest from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

import * as matchService from '../../services/match.service';

// Spies
const getMatchSpy = jest.spyOn(matchService, 'getMatch');
const getUserMatchesSpy = jest.spyOn(matchService, 'getUserMatches');
const createMatchSpy = jest.spyOn(matchService, 'createMatch');
const deleteMatchSpy = jest.spyOn(matchService, 'deleteMatch');
const updateMatchStatusSpy = jest.spyOn(matchService, 'updateMatchStatus');
const generateMatchRecommendationSpy = jest.spyOn(matchService, 'generateMatchRecommendation');

// valid objectId for spec
const VALID_ID = '65e9b58910afe6e94fc6e6dc';
const VALID_ID_2 = '65e9b58910afe6e94fc6e6dd';

describe('Match Controller (OpenAPI-SPEC-CORRECT)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /match/getMatch/{matchId}
  // -----------------------------
  describe('GET /api/match/getMatch/:matchId', () => {
    test('200 OK - match found', async () => {
      const mockMatch = {
        _id: VALID_ID,
        userA: VALID_ID,
        userB: VALID_ID_2,
        status: 'pending',
        score: 0,
        initiatedBy: VALID_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getMatchSpy.mockResolvedValueOnce(mockMatch as any);

      const res = await supertest(app).get(`/api/match/getMatch/${VALID_ID}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockMatch);
    });

    test('500 - service error object', async () => {
      getMatchSpy.mockResolvedValueOnce({ error: 'Match not found' } as any);

      const res = await supertest(app).get(`/api/match/getMatch/${VALID_ID}`);

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error retrieving match: Match not found');
    });

    test('500 - thrown error', async () => {
      getMatchSpy.mockRejectedValueOnce(new Error('DB error'));

      const res = await supertest(app).get(`/api/match/getMatch/${VALID_ID}`);

      expect(res.status).toBe(500);
    });
  });

  // -----------------------------
  // GET /match/getUserMatches/{userId}
  // -----------------------------
  describe('GET /api/match/getUserMatches/:userId', () => {
    test('200 OK - cleaned matches returned', async () => {
      const mockMatches = [
        {
          _id: VALID_ID,
          userA: VALID_ID,
          userB: VALID_ID_2,
          status: 'pending',
          score: 0,
          initiatedBy: VALID_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      getUserMatchesSpy.mockResolvedValueOnce(mockMatches as any);

      const res = await supertest(app).get(`/api/match/getUserMatches/${VALID_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(VALID_ID);
    });

    test('500 - service returned error object', async () => {
      getUserMatchesSpy.mockResolvedValueOnce({ error: 'DB issue' } as any);

      const res = await supertest(app).get(`/api/match/getUserMatches/${VALID_ID}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB issue');
    });

    test('500 - thrown error', async () => {
      getUserMatchesSpy.mockRejectedValueOnce(new Error('DB down'));

      const res = await supertest(app).get(`/api/match/getUserMatches/${VALID_ID}`);

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error retrieving all user matches: DB down');
    });
  });

  // -----------------------------
  // POST /match/create
  // -----------------------------
  describe('POST /api/match/create', () => {
    test('200 OK - match created', async () => {
      const body = {
        userA: VALID_ID,
        userB: VALID_ID_2,
        status: 'pending',
        score: 5,
        initiatedBy: VALID_ID,
      };

      const saved = {
        ...body,
        _id: VALID_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createMatchSpy.mockResolvedValueOnce(saved as any);

      const res = await supertest(app).post('/api/match/create').send(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(saved);
      expect(createMatchSpy).toHaveBeenCalledWith(body);
    });

    test('500 - service returned {error}', async () => {
      createMatchSpy.mockResolvedValueOnce({ error: 'DB error' } as any);

      const res = await supertest(app)
        .post('/api/match/create')
        .set('Content-Type', 'application/json')
        .send({
          userA: VALID_ID,
          userB: VALID_ID_2,
          status: 'pending',
          score: 0,
          initiatedBy: VALID_ID,
        });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error creating a match: DB error');
    });

    test('500 - thrown error', async () => {
      createMatchSpy.mockRejectedValueOnce(new Error('Crash'));

      const res = await supertest(app)
        .post('/api/match/create')
        .set('Content-Type', 'application/json')
        .send({
          userA: VALID_ID,
          userB: VALID_ID_2,
          status: 'pending',
          score: 0,
          initiatedBy: VALID_ID,
        });

      expect(res.status).toBe(500);
    });

    test('415 - missing body', async () => {
      const res = await supertest(app).post('/api/match/create');

      expect(res.status).toBe(415);
    });
  });

  // -----------------------------
  // PATCH /match/updateStatus/{matchId}
  // -----------------------------
  describe('PATCH /api/match/updateStatus/:matchId', () => {
    test('200 OK - updated successfully', async () => {
      const now = new Date().toISOString();
      const updatedMatch = {
        _id: VALID_ID,
        userA: VALID_ID,
        userB: VALID_ID_2,
        status: 'accepted',
        score: 0,
        initiatedBy: VALID_ID,
        createdAt: now,
        updatedAt: now,
      };

      updateMatchStatusSpy.mockResolvedValueOnce(updatedMatch as any);

      const res = await supertest(app)
        .patch(`/api/match/updateStatus/${VALID_ID}`)
        .send({ userId: VALID_ID, status: 'accepted' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedMatch);
    });

    test('403 forbidden', async () => {
      updateMatchStatusSpy.mockResolvedValueOnce({
        error: 'Unauthorized: cannot update',
      } as any);

      const res = await supertest(app)
        .patch(`/api/match/updateStatus/${VALID_ID}`)
        .send({ userId: VALID_ID_2, status: 'accepted' });

      expect(res.status).toBe(403);
    });

    test('404 not found', async () => {
      updateMatchStatusSpy.mockResolvedValueOnce({
        error: 'Match not found',
      } as any);

      const res = await supertest(app)
        .patch(`/api/match/updateStatus/${VALID_ID}`)
        .send({ userId: VALID_ID, status: 'accepted' });

      expect(res.status).toBe(404);
    });

    test('500 thrown exception', async () => {
      updateMatchStatusSpy.mockRejectedValueOnce(new Error('Crashed'));

      const res = await supertest(app)
        .patch(`/api/match/updateStatus/${VALID_ID}`)
        .send({ userId: VALID_ID, status: 'accepted' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error updating match status: Crashed');
    });

    test('500 other errors', async () => {
      updateMatchStatusSpy.mockResolvedValueOnce({
        error: 'Failure',
      } as any);

      const res = await supertest(app)
        .patch(`/api/match/updateStatus/${VALID_ID}`)
        .send({ userId: VALID_ID, status: 'accepted' });

      expect(res.status).toBe(500);
    });
  });

  // -----------------------------
  // DELETE /match/delete/{matchId}
  // -----------------------------
  describe('DELETE /api/match/delete/:matchId', () => {
    test('200 OK - match deleted', async () => {
      const now = new Date().toISOString();
      const deletedMatch = {
        _id: VALID_ID,
        userA: VALID_ID,
        userB: VALID_ID_2,
        status: 'pending',
        score: 0,
        initiatedBy: VALID_ID,
        createdAt: now,
        updatedAt: now,
      };

      deleteMatchSpy.mockResolvedValueOnce(deletedMatch as any);

      const res = await supertest(app)
        .delete(`/api/match/delete/${VALID_ID}`)
        .send({ userId: VALID_ID });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        match: deletedMatch,
        message: 'Match deleted successfully',
      });
    });

    test('403 forbidden', async () => {
      deleteMatchSpy.mockResolvedValueOnce({
        error: 'Unauthorized: cannot delete',
      } as any);

      const res = await supertest(app)
        .delete(`/api/match/delete/${VALID_ID}`)
        .send({ userId: VALID_ID_2 });

      expect(res.status).toBe(403);
    });

    test('404 not found', async () => {
      deleteMatchSpy.mockResolvedValueOnce({
        error: 'Match not found',
      } as any);

      const res = await supertest(app)
        .delete(`/api/match/delete/${VALID_ID}`)
        .send({ userId: VALID_ID });

      expect(res.status).toBe(404);
    });

    test('500 other errors', async () => {
      deleteMatchSpy.mockResolvedValueOnce({
        error: 'DB explosion',
      } as any);

      const res = await supertest(app)
        .delete(`/api/match/delete/${VALID_ID}`)
        .send({ userId: VALID_ID });

      expect(res.status).toBe(500);
    });

    test('500 - thrown exception in deleteMatch', async () => {
      deleteMatchSpy.mockRejectedValueOnce(new Error('Crash delete'));

      const res = await supertest(app)
        .delete(`/api/match/delete/${VALID_ID}`)
        .send({ userId: VALID_ID });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error deleting match: Crash delete');
    });

    test('400 missing userId', async () => {
      const res = await supertest(app).delete(`/api/match/delete/${VALID_ID}`).send({});

      const openApiError = JSON.parse(res.text);

      expect(res.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/userId');
    });
  });

  // -----------------------------
  // GET /match/recommend/{userId}
  // -----------------------------
  describe('GET /api/match/recommend/:userId', () => {
    test('200 success', async () => {
      const mockData = {
        recommendations: [
          {
            userId: 'u2',
            score: 0.9,
            profile: {
              _id: new mongoose.Types.ObjectId(),
              userId: {
                _id: new mongoose.Types.ObjectId(),
                username: 'john',
              },
              programmingLanguage: ['JS'],
              preferences: {
                preferredLanguages: ['JS'],
              },
            },
          },
        ],
      };

      generateMatchRecommendationSpy.mockResolvedValueOnce(mockData as any);

      const res = await supertest(app).get(`/api/match/recommend/${VALID_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations.length).toBe(1);
    });

    test('200 empty list', async () => {
      generateMatchRecommendationSpy.mockResolvedValueOnce({
        recommendations: [],
      } as any);

      const res = await supertest(app).get(`/api/match/recommend/${VALID_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations).toEqual([]);
      expect(res.body.message).toBe('No recommendations found');
    });

    test('500 error object', async () => {
      generateMatchRecommendationSpy.mockResolvedValueOnce({
        error: 'Compute failure',
      } as any);

      const res = await supertest(app).get(`/api/match/recommend/${VALID_ID}`);

      expect(res.status).toBe(500);
    });

    test('500 thrown error', async () => {
      generateMatchRecommendationSpy.mockRejectedValueOnce(new Error('ML failure'));

      const res = await supertest(app).get(`/api/match/recommend/${VALID_ID}`);

      expect(res.status).toBe(500);
    });
  });
});
