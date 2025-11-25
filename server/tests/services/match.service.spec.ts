import mongoose from 'mongoose';
import MatchModel from '../../models/match.model';
import MatchProfileModel from '../../models/matchProfiles.model';
import {
  createMatch,
  getMatch,
  getUserMatches,
  deleteMatch,
  updateMatchStatus,
  generateMatchRecommendation,
} from '../../services/match.service';

import extractFeatures from '../../services/matchFeature.service';
import computeScore from '../../services/matchMath.service';

// Mock helpers
jest.mock('../../services/matchFeature.service');
jest.mock('../../services/matchMath.service');

describe('Match Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();

  const mockMatch = {
    _id: validId,
    userA: validId,
    userB: otherId,
    initiatedBy: validId,
    status: 'pending',
    score: 0.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject() {
      return {
        _id: this._id,
        userA: this.userA,
        userB: this.userB,
        initiatedBy: this.initiatedBy,
        status: this.status,
        score: this.score,
      };
    },
  };

  const mockProfile = {
    _id: validId,
    userId: { _id: validId, username: 'testUser' },
    isActive: true,
    programmingLanguage: ['Python'],
    level: 'INTERMEDIATE',
    preferences: {
      preferredLanguages: ['Python'],
      preferredLevel: 'INTERMEDIATE',
    },
    onboardingAnswers: {
      goals: 'learn',
      personality: 'pair',
      projectType: 'ml',
    },
  };

  // Utility to mock findOne / find behavior
  function mockLeanExec(result: any) {
    return {
      lean: () => ({
        exec: () => Promise.resolve(result),
      }),
    } as any;
  }

  // Mocks for findOne chain (success)
  const mockFindOneReturn = (value: any) => ({
    populate: () => ({
      lean: () => value,
    }),
  });

  // Mocks for findOne chain (reject)
  const mockFindOneReject = (err: Error) => ({
    populate: () => ({
      lean: () => {
        throw err;
      },
    }),
  });

  // Mocks for find chain
  const mockFindReturn = (value: any[]) => ({
    populate: () => ({
      lean: () => value,
    }),
  });

  // ────────────────────────────────────────────────
  // CREATE MATCH
  // ────────────────────────────────────────────────

  describe('createMatch', () => {
    test('should create and return a normalized match', async () => {
      jest.spyOn(MatchModel.prototype, 'save').mockResolvedValue(mockMatch as any);

      const result = await createMatch({
        userA: validId,
        userB: otherId,
        initiatedBy: validId,
        status: 'pending',
      } as any);

      expect(result).toMatchObject({
        _id: validId.toString(),
        userA: validId.toString(),
        userB: otherId.toString(),
        initiatedBy: validId.toString(),
      });
    });

    test('should return error when save fails', async () => {
      jest.spyOn(MatchModel.prototype, 'save').mockRejectedValue(new Error('Save failed'));

      const result = await createMatch({} as any);
      expect(result).toEqual({ error: 'Save failed' });
    });
  });

  // ────────────────────────────────────────────────
  // GET MATCH
  // ────────────────────────────────────────────────

  describe('getMatch', () => {
    test('should return match if found', async () => {
      jest.spyOn(MatchModel, 'findById').mockReturnValue(mockLeanExec(mockMatch));

      const result = await getMatch(validId.toString());
      expect(result).toEqual(mockMatch);
    });

    test('should return error when not found', async () => {
      jest.spyOn(MatchModel, 'findById').mockReturnValue(mockLeanExec(null));

      const result = await getMatch(validId.toString());
      expect(result).toEqual({ error: 'Match Profile not found' });
    });

    test('should return error on DB failure', async () => {
      jest.spyOn(MatchModel, 'findById').mockReturnValue({
        lean: () => ({
          exec: () => Promise.reject(new Error('DB fail')),
        }),
      } as any);

      const result = await getMatch(validId.toString());
      expect(result).toEqual({ error: 'DB fail' });
    });
  });

  // ────────────────────────────────────────────────
  // GET USER MATCHES
  // ────────────────────────────────────────────────

  describe('getUserMatches', () => {
    test('should return enriched matches', async () => {
      jest.spyOn(MatchModel, 'find').mockReturnValue(mockLeanExec([mockMatch]));

      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: () => ({
          lean: () => ({
            exec: () => Promise.resolve(mockProfile),
          }),
        }),
      } as any);

      const result = await getUserMatches(validId.toString());
      expect(Array.isArray(result)).toBe(true);
      if ('error' in result) {
        throw new Error('Expected successful match list, got error');
      }
      const array = result as any[];
      expect(array[0].otherUserProfile).toBeDefined();
      expect(array[0].otherUserProfile!.userId.username).toBe('testUser');
    });

    test('should still return match when other user profile is missing', async () => {
      jest.spyOn(MatchModel, 'find').mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve([mockMatch]),
        }),
      } as any);

      // return null
      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: () => ({
          lean: () => ({
            exec: () => Promise.resolve(null),
          }),
        }),
      } as any);

      const result = await getUserMatches(validId.toString());

      expect(Array.isArray(result)).toBe(true);
      if ('error' in result) fail('unexpected error');

      const array = result as any[];
      expect(array[0].otherUserProfile).toBe(null);
    });

    test('should handle case where userId matches userB instead of userA', async () => {
      const matchWhereUserIsB = {
        ...mockMatch,
        userA: new mongoose.Types.ObjectId(), // different
        userB: validId, // user is B, not A
      };

      jest.spyOn(MatchModel, 'find').mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve([matchWhereUserIsB]),
        }),
      } as any);

      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: () => ({
          lean: () => ({
            exec: () => Promise.resolve(mockProfile),
          }),
        }),
      } as any);

      const result = await getUserMatches(validId.toString());
      if ('error' in result) fail();

      const array = result as any[];

      // Ensure the "other user" is userA since user is matching as userB
      expect(array[0].otherUserProfile).toBeDefined();
    });

    test('should map userId fallback when populated userId is string', async () => {
      jest.spyOn(MatchModel, 'find').mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve([mockMatch]),
        }),
      } as any);

      const profileWithString = {
        ...mockProfile,
        userId: validId.toString(),
      };

      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: () => ({
          lean: () => ({
            exec: () => Promise.resolve(profileWithString),
          }),
        }),
      } as any);

      const result = await getUserMatches(validId.toString());
      if ('error' in result) fail();

      const array = result as any[];
      expect(array[0].otherUserProfile!.userId).toEqual({
        _id: validId.toString(),
        username: 'Unknown',
      });
    });

    test('should set initiatedBy to null when missing', async () => {
      const matchWithoutInitiator = {
        ...mockMatch,
        initiatedBy: undefined,
      };

      jest.spyOn(MatchModel, 'find').mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve([matchWithoutInitiator]),
        }),
      } as any);

      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: () => ({
          lean: () => ({
            exec: () => Promise.resolve(null),
          }),
        }),
      } as any);

      const result = await getUserMatches(validId.toString());
      if ('error' in result) fail();

      const array = result as any[];
      expect(array[0].initiatedBy).toBe(null);
    });

    test('should return error if DB throws on findById', async () => {
      jest.spyOn(MatchModel, 'findById').mockRejectedValue(new Error('DB fail'));

      const result = await updateMatchStatus(validId.toString(), validId.toString(), 'accepted');

      expect(result).toEqual({ error: 'DB fail' });
    });

    test('should return error if saving the match fails', async () => {
      jest.spyOn(MatchModel, 'findById').mockResolvedValue(mockMatch as any);

      (mockMatch as any).save = jest.fn().mockRejectedValue(new Error('Save failed'));

      const result = await updateMatchStatus(validId.toString(), validId.toString(), 'accepted');

      expect(result).toEqual({ error: 'Save failed' });
    });

    test('should map userId when populated userId is an object', async () => {
      jest.spyOn(MatchModel, 'find').mockReturnValue({
        lean: () => ({
          exec: () => Promise.resolve([mockMatch]),
        }),
      } as any);

      const profileWithObjectUserId = {
        ...mockProfile,
        userId: { _id: validId, username: 'testUser' }, // object path
      };

      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: () => ({
          lean: () => ({
            exec: () => Promise.resolve(profileWithObjectUserId),
          }),
        }),
      } as any);

      const result = await getUserMatches(validId.toString());
      if ('error' in result) fail();

      const array = result as any[];
      expect(array[0].otherUserProfile!.userId).toEqual({
        _id: validId.toString(),
        username: 'testUser',
      });
    });

    test('should return error when DB fails', async () => {
      jest.spyOn(MatchModel, 'find').mockReturnValue({
        lean: () => ({
          exec: () => Promise.reject(new Error('Find failed')),
        }),
      } as any);

      const result = await getUserMatches(validId.toString());
      expect(result).toEqual({ error: 'Find failed' });
    });
  });

  // ────────────────────────────────────────────────
  // DELETE MATCH
  // ────────────────────────────────────────────────

  describe('deleteMatch', () => {
    test('should delete if user is participant', async () => {
      jest.spyOn(MatchModel, 'findById').mockResolvedValue(mockMatch as any);
      jest.spyOn(MatchModel, 'findByIdAndDelete').mockResolvedValue(mockMatch as any);

      const result = await deleteMatch(validId.toString(), validId.toString());
      expect(result).toEqual(mockMatch);
    });

    test('should forbid unauthorized delete', async () => {
      jest.spyOn(MatchModel, 'findById').mockResolvedValue(mockMatch as any);

      const result = await deleteMatch(validId.toString(), 'randomUser');
      expect(result).toEqual({
        error: 'Unauthorized: Only participants can delete this match',
      });
    });

    test('should return error if not found', async () => {
      jest.spyOn(MatchModel, 'findById').mockResolvedValue(null);

      const result = await deleteMatch('x', 'y');
      expect(result).toEqual({ error: 'Match not found' });
    });

    test('should return error when DB throws', async () => {
      jest.spyOn(MatchModel, 'findById').mockRejectedValue(new Error('DB failure'));

      const result = await deleteMatch(validId.toString(), validId.toString());

      expect(result).toEqual({ error: 'DB failure' });
    });

    test('should return error if deletion fails', async () => {
      jest.spyOn(MatchModel, 'findById').mockResolvedValue(mockMatch as any);
      jest.spyOn(MatchModel, 'findByIdAndDelete').mockResolvedValue(null);

      const result = await deleteMatch(validId.toString(), validId.toString());
      expect(result).toEqual({ error: 'Match not found or already deleted' });
    });
  });

  // ────────────────────────────────────────────────
  // UPDATE MATCH STATUS
  // ────────────────────────────────────────────────

  describe('updateMatchStatus', () => {
    test('should update match status', async () => {
      const updated = {
        ...mockMatch,
        status: 'accepted',
        toObject: () => ({ ...mockMatch, status: 'accepted' }),
      };

      jest.spyOn(MatchModel, 'findById').mockResolvedValue(mockMatch as any);
      (mockMatch as any).save = jest.fn().mockResolvedValue(updated);

      const result = await updateMatchStatus(validId.toString(), validId.toString(), 'accepted');
      if ('error' in result) {
        throw new Error('Expected success but received error');
      }

      expect(result.status).toBe('accepted');
    });

    test('should block unauthorized update', async () => {
      jest.spyOn(MatchModel, 'findById').mockResolvedValue(mockMatch as any);

      const result = await updateMatchStatus(validId.toString(), 'wrong', 'accepted');
      expect(result).toEqual({
        error: 'Unauthorized: Only participants can update this match',
      });
    });

    test('should give error when match not found', async () => {
      jest.spyOn(MatchModel, 'findById').mockResolvedValue(null);

      const result = await updateMatchStatus(validId.toString(), validId.toString(), 'accepted');
      expect(result).toEqual({ error: 'Match not found' });
    });
  });

  // ────────────────────────────────────────────────
  // GENERATE MATCH RECOMMENDATIONS
  // ────────────────────────────────────────────────

  describe('generateMatchRecommendation', () => {
    test('should return empty list if user has no active profile', async () => {
      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue(mockFindOneReturn(null) as any);

      jest.spyOn(MatchProfileModel, 'find').mockReturnValue(mockFindReturn([]) as any);

      const result = await generateMatchRecommendation(validId.toString());
      expect(result).toEqual({ recommendations: [] });
    });

    test('should generate sorted recommendations', async () => {
      jest
        .spyOn(MatchProfileModel, 'findOne')
        .mockReturnValue(mockFindOneReturn(mockProfile) as any);

      jest.spyOn(MatchProfileModel, 'find').mockReturnValue(mockFindReturn([mockProfile]) as any);

      (extractFeatures as jest.Mock).mockReturnValue([1, 1, 1, 1, 1, 1]);
      (computeScore as jest.Mock).mockReturnValue(0.9);

      const result = await generateMatchRecommendation(validId.toString());

      expect(result.recommendations!.length).toBe(1);
      expect(result.recommendations![0].score).toBe(0.9);
    });

    test('should skip recommendations with skillOverlap = 0', async () => {
      jest
        .spyOn(MatchProfileModel, 'findOne')
        .mockReturnValue(mockFindOneReturn(mockProfile) as any);

      jest.spyOn(MatchProfileModel, 'find').mockReturnValue(mockFindReturn([mockProfile]) as any);

      (extractFeatures as jest.Mock).mockReturnValue([0, 1, 1, 1, 1, 1]);

      const result = await generateMatchRecommendation(validId.toString());
      expect(result.recommendations!.length).toBe(0);
    });

    test('should sort recommendations by score descending', async () => {
      jest
        .spyOn(MatchProfileModel, 'findOne')
        .mockReturnValue(mockFindOneReturn(mockProfile) as any);

      const profileA = { ...mockProfile, userId: { _id: otherId, username: 'A' } };
      const profileB = { ...mockProfile, userId: { _id: validId, username: 'B' } };

      // Two profiles returned -> triggers sorting
      jest
        .spyOn(MatchProfileModel, 'find')
        .mockReturnValue(mockFindReturn([profileA, profileB]) as any);

      // Feature vectors don't matter, only score differences matter:
      (extractFeatures as jest.Mock)
        .mockReturnValueOnce([1, 1, 1, 1, 1, 1]) // profileA → score 0.5
        .mockReturnValueOnce([1, 1, 1, 1, 1, 1]); // profileB → score 0.9

      (computeScore as jest.Mock).mockReturnValueOnce(0.5).mockReturnValueOnce(0.9);

      const result = await generateMatchRecommendation(validId.toString());
      if ('error' in result) fail();

      const recs = result.recommendations!;
      expect(recs.length).toBe(2);

      // Sorted descending -> B (0.9) should come before A (0.5)
      expect(recs[0].score).toBe(0.9);
      expect(recs[1].score).toBe(0.5);
    });

    test('should return error when populate failed because userId is still string', async () => {
      // mock user has active profile
      jest
        .spyOn(MatchProfileModel, 'findOne')
        .mockReturnValue(mockFindOneReturn(mockProfile) as any);

      // mock otherProfilesDocs returns a doc with userId STILL A STRING
      const badProfile = {
        ...mockProfile,
        userId: validId.toString(), // <-- triggers the error branch
      };

      jest.spyOn(MatchProfileModel, 'find').mockReturnValue(mockFindReturn([badProfile]) as any);

      const result = await generateMatchRecommendation(validId.toString());

      expect(result).toEqual({
        error: 'Populate failed: userId is still ObjectId/string',
      });
    });

    test('should return error if DB fails', async () => {
      jest
        .spyOn(MatchProfileModel, 'findOne')
        .mockReturnValue(mockFindOneReject(new Error('DB fail')) as any);

      jest.spyOn(MatchProfileModel, 'find').mockReturnValue(mockFindReturn([]) as any);

      const result = await generateMatchRecommendation(validId.toString());
      expect(result).toEqual({ error: 'DB fail' });
    });
  });
});
