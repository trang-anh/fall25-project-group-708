import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';

import * as matchProfileService from '../../services/matchProfile.service';

// Spies on service layer
const getMatchProfileSpy = jest.spyOn(matchProfileService, 'getMatchProfile');
const getAllMatchProfilesSpy = jest.spyOn(matchProfileService, 'getAllMatchProfiles');
const createMatchProfileSpy = jest.spyOn(matchProfileService, 'createMatchProfile');
const toggleMatchProfileActiveSpy = jest.spyOn(matchProfileService, 'toggleMatchProfileActive');
const updateMatchProfileSpy = jest.spyOn(matchProfileService, 'updateMatchProfile');
const checkOnboardingStatusSpy = jest.spyOn(matchProfileService, 'checkOnboardingStatus');

// Valid objectIds for OpenAPI / validators
const VALID_ID = '65e9b58910afe6e94fc6e6dc';
const VALID_ID_2 = '65e9b58910afe6e94fc6e6dd';

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('MatchProfile Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /matchProfile/getMatchProfile/{userId}
  // -----------------------------
  describe('GET /api/matchProfile/getMatchProfile/:userId', () => {
    test('200 OK - match profile found (with populated userId)', async () => {
      const now = new Date().toISOString();
      const mockProfile = {
        _id: VALID_ID,
        userId: {
          _id: new mongoose.Types.ObjectId(VALID_ID),
          username: 'alice',
        },
        isActive: true,
        age: 20,
        gender: 'FEMALE',
        location: 'NORTH AMERICA',
        programmingLanguage: ['JavaScript', 'TypeScript'],
        level: 'INTERMEDIATE',
        preferences: {
          preferredLanguages: ['JavaScript'],
          preferredLevel: 'INTERMEDIATE',
        },
        onboardingAnswers: {
          goals: 'learn',
          personality: 'pair programming',
          projectType: 'web',
        },
        biography: 'hi',
        profileImageUrl: 'http://example.com/pic.png',
        createdAt: now,
        updatedAt: now,
      };

      getMatchProfileSpy.mockResolvedValueOnce(mockProfile as any);

      const res = await supertest(app).get(`/api/matchProfile/getMatchProfile/${VALID_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.userId).toEqual({
        _id: VALID_ID,
        username: 'alice',
      });
    });

    test('500 - service returned {error}', async () => {
      getMatchProfileSpy.mockResolvedValueOnce({ error: 'Profile not found' } as any);

      const res = await supertest(app).get(`/api/matchProfile/getMatchProfile/${VALID_ID}`);

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error retrieving match profile: Profile not found');
    });

    test('500 - thrown error', async () => {
      getMatchProfileSpy.mockRejectedValueOnce(new Error('DB down'));

      const res = await supertest(app).get(`/api/matchProfile/getMatchProfile/${VALID_ID}`);

      expect(res.status).toBe(500);
    });
  });

  // -----------------------------
  // GET /matchProfile/getAllMatchProfiles
  // -----------------------------
  describe('GET /api/matchProfile/getAllMatchProfiles', () => {
    test('200 OK - all profiles returned & userId normalized', async () => {
      const now = new Date().toISOString();

      const profile1 = {
        _id: VALID_ID,
        userId: { _id: new mongoose.Types.ObjectId(VALID_ID) },
        isActive: true,
        age: '20',
        gender: 'FEMALE',
        location: 'NORTH AMERICA',
        programmingLanguage: ['JavaScript'],
        level: 'INTERMEDIATE',
        preferences: {
          preferredLanguages: ['JavaScript'],
          preferredLevel: 'INTERMEDIATE',
        },
        onboardingAnswers: {
          goals: 'learn',
          personality: 'pair programming',
          projectType: 'web',
        },
        biography: 'hi',
        profileImageUrl: 'url',
        createdAt: now,
        updatedAt: now,
        toObject: function () {
          return this;
        },
      };

      const profile2 = {
        _id: VALID_ID_2,
        userId: new mongoose.Types.ObjectId(VALID_ID_2), // Use mongoose ObjectId
        isActive: false,
        age: '21',
        gender: 'MALE',
        location: 'ASIA',
        programmingLanguage: ['Python'],
        level: 'BEGINNER',
        preferences: {
          preferredLanguages: ['Python'],
          preferredLevel: 'BEGINNER',
        },
        onboardingAnswers: {
          goals: 'practice',
          personality: 'solo',
          projectType: 'ml',
        },
        biography: 'yo',
        profileImageUrl: 'url2',
        createdAt: now,
        updatedAt: now,
        toObject: function () {
          return this;
        },
      };

      getAllMatchProfilesSpy.mockResolvedValueOnce([profile1, profile2] as any);

      const res = await supertest(app).get('/api/matchProfile/getAllMatchProfiles');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].userId).toBe(VALID_ID);
      expect(res.body[1].userId).toBe(VALID_ID_2);
    });

    test('500 - service returned {error}', async () => {
      getAllMatchProfilesSpy.mockResolvedValueOnce({ error: 'Database error' } as any);

      const res = await supertest(app).get('/api/matchProfile/getAllMatchProfiles');

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error retrieving all matching profile: Database error');
    });

    test('500 - thrown error', async () => {
      getAllMatchProfilesSpy.mockRejectedValueOnce(new Error('Crash'));

      const res = await supertest(app).get('/api/matchProfile/getAllMatchProfiles');

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error retrieving all matching profile: Crash');
    });
  });

  // -----------------------------
  // POST /matchProfile/create
  // -----------------------------
  describe('POST /api/matchProfile/create', () => {
    const baseBody = {
      userId: VALID_ID,
      isActive: true,
      age: 20,
      gender: 'FEMALE',
      location: 'NORTH AMERICA',
      programmingLanguage: ['JavaScript', 'TypeScript'],
      level: 'INTERMEDIATE',
      preferences: {
        preferredLanguages: ['JavaScript', 'TypeScript'],
        preferredLevel: 'INTERMEDIATE',
      },
      onboardingAnswers: {
        goals: 'learn',
        personality: 'pair programming',
        projectType: 'web',
      },
      biography: 'hi',
      profileImageUrl: 'http://example.com/pic.png',
    };

    test('200 OK - match profile created', async () => {
      const now = new Date().toISOString();
      const savedProfile = {
        _id: VALID_ID,
        userId: { _id: VALID_ID }, // Plain string, route will transform it
        isActive: true,
        age: 20,
        gender: 'FEMALE',
        location: 'NORTH AMERICA',
        programmingLanguage: ['JavaScript', 'TypeScript'],
        level: 'INTERMEDIATE',
        preferences: {
          preferredLanguages: ['JavaScript', 'TypeScript'],
          preferredLevel: 'INTERMEDIATE',
        },
        onboardingAnswers: {
          goals: 'learn',
          personality: 'pair programming',
          projectType: 'web',
        },
        biography: 'hi',
        profileImageUrl: 'http://example.com/pic.png',
        createdAt: now,
        updatedAt: now,
        toObject: function () {
          return this;
        },
      };

      createMatchProfileSpy.mockResolvedValueOnce(savedProfile as any);

      const res = await supertest(app)
        .post('/api/matchProfile/create')
        .set('Content-Type', 'application/json')
        .send(baseBody);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(VALID_ID);
      expect(res.body.userId).toEqual({
        _id: VALID_ID,
      });
    });

    test('500 - service returned {error}', async () => {
      createMatchProfileSpy.mockResolvedValueOnce({ error: 'DB error' } as any);

      const res = await supertest(app)
        .post('/api/matchProfile/create')
        .set('Content-Type', 'application/json')
        .send(baseBody);

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error creating a match profile: DB error');
    });

    test('500 - thrown error', async () => {
      createMatchProfileSpy.mockRejectedValueOnce(new Error('Crash'));

      const res = await supertest(app)
        .post('/api/matchProfile/create')
        .set('Content-Type', 'application/json')
        .send(baseBody);

      expect(res.status).toBe(500);
    });

    test('415 - missing body', async () => {
      const res = await supertest(app).post('/api/matchProfile/create');

      expect(res.status).toBe(415);
    });
  });

  // -----------------------------
  // PATCH /matchProfile/toggleMatchProfileActive/{userId}
  // -----------------------------
  describe('PATCH /api/matchProfile/toggleMatchProfileActive/:userId', () => {
    test('200 OK - active status toggled & normalized userId', async () => {
      const now = new Date().toISOString();
      const profile = {
        _id: VALID_ID,
        userId: VALID_ID,
        isActive: false,
        age: 20,
        gender: 'FEMALE',
        location: 'NORTH AMERICA',
        programmingLanguage: ['JS'],
        level: 'INTERMEDIATE',
        preferences: {
          preferredLanguages: ['JS'],
          preferredLevel: 'INTERMEDIATE',
        },
        onboardingAnswers: {
          goals: 'learn',
          personality: 'pair',
          projectType: 'web',
        },
        biography: 'bio',
        profileImageUrl: 'url',
        createdAt: now,
        updatedAt: now,
      };

      toggleMatchProfileActiveSpy.mockResolvedValueOnce(profile as any);

      const res = await supertest(app)
        .patch(`/api/matchProfile/toggleMatchProfileActive/${VALID_ID}`)
        .set('Content-Type', 'application/json')
        .send({ userId: VALID_ID, isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.userId).toEqual({
        _id: VALID_ID,
        username: 'Unknown',
      });
    });

    test('404 not found', async () => {
      toggleMatchProfileActiveSpy.mockResolvedValueOnce({
        error: 'Match profile not found',
      } as any);

      const res = await supertest(app)
        .patch(`/api/matchProfile/toggleMatchProfileActive/${VALID_ID}`)
        .set('Content-Type', 'application/json')
        .send({ userId: VALID_ID, isActive: false });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Match profile not found');
    });

    test('500 other error', async () => {
      toggleMatchProfileActiveSpy.mockResolvedValueOnce({
        error: 'DB explosion',
      } as any);

      const res = await supertest(app)
        .patch(`/api/matchProfile/toggleMatchProfileActive/${VALID_ID}`)
        .set('Content-Type', 'application/json')
        .send({ userId: VALID_ID, isActive: true });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('DB explosion');
    });

    test('500 thrown exception', async () => {
      toggleMatchProfileActiveSpy.mockRejectedValueOnce(new Error('Crash toggle'));

      const res = await supertest(app)
        .patch(`/api/matchProfile/toggleMatchProfileActive/${VALID_ID}`)
        .set('Content-Type', 'application/json')
        .send({ userId: VALID_ID, isActive: true });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error toggling match profile membership: Crash toggle');
    });
  });

  // -----------------------------
  // PATCH /matchProfile/updateMatchProfile/{userId}
  // -----------------------------
  describe('PATCH /api/matchProfile/updateMatchProfile/:userId', () => {
    test('200 OK - profile updated & normalized userId', async () => {
      const now = new Date().toISOString();
      const updatedProfile = {
        _id: VALID_ID,
        userId: VALID_ID,
        isActive: true,
        age: 21,
        gender: 'FEMALE',
        location: 'NORTH AMERICA',
        programmingLanguage: ['JS', 'TS'],
        level: 'ADVANCED',
        preferences: {
          preferredLanguages: ['JS', 'TS'],
          preferredLevel: 'ADVANCED',
        },
        onboardingAnswers: {
          goals: 'grow',
          personality: 'pair',
          projectType: 'web',
        },
        biography: 'updated bio',
        profileImageUrl: 'url',
        createdAt: now,
        updatedAt: now,
      };

      updateMatchProfileSpy.mockResolvedValueOnce(updatedProfile as any);

      const res = await supertest(app)
        .patch(`/api/matchProfile/updateMatchProfile/${VALID_ID}`)
        .set('Content-Type', 'application/json')
        .send({ userId: VALID_ID, biography: 'updated bio' });

      expect(res.status).toBe(200);
      expect(res.body.userId).toEqual({
        _id: VALID_ID,
        username: 'Unknown',
      });
      expect(res.body.biography).toBe('updated bio');
    });

    test('400 - service returned {error}', async () => {
      updateMatchProfileSpy.mockResolvedValueOnce({
        error: 'Invalid input',
      } as any);

      const res = await supertest(app)
        .patch(`/api/matchProfile/updateMatchProfile/${VALID_ID}`)
        .set('Content-Type', 'application/json')
        .send({ userId: VALID_ID, biography: 'x' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid input');
    });

    test('500 - thrown error', async () => {
      updateMatchProfileSpy.mockRejectedValueOnce(new Error('Crash update'));

      const res = await supertest(app)
        .patch(`/api/matchProfile/updateMatchProfile/${VALID_ID}`)
        .set('Content-Type', 'application/json')
        .send({ userId: VALID_ID, biography: 'x' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error updating match profile: Crash update');
    });
  });

  // -----------------------------
  // GET /matchProfile/checkOnboardingStatus/{userId}
  // -----------------------------
  describe('GET /api/matchProfile/checkOnboardingStatus/:userId', () => {
    test('200 OK - onboarding status returned', async () => {
      const status = {
        hasProfile: true,
        isActive: true,
      };

      checkOnboardingStatusSpy.mockResolvedValueOnce(status as any);

      const res = await supertest(app).get(`/api/matchProfile/checkOnboardingStatus/${VALID_ID}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(status);
    });

    test('500 - service returned {error}', async () => {
      checkOnboardingStatusSpy.mockResolvedValueOnce({
        error: 'No profile',
      } as any);

      const res = await supertest(app).get(`/api/matchProfile/checkOnboardingStatus/${VALID_ID}`);

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error checking onboarding status: No profile');
    });

    test('500 - thrown error', async () => {
      checkOnboardingStatusSpy.mockRejectedValueOnce(new Error('DB down'));

      const res = await supertest(app).get(`/api/matchProfile/checkOnboardingStatus/${VALID_ID}`);

      expect(res.status).toBe(500);
      expect(res.text).toContain('Error checking onboarding status: DB down');
    });
  });
});
