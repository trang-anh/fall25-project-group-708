import mongoose from 'mongoose';
import MatchProfileModel from '../../models/matchProfiles.model';
import {
  createMatchProfile,
  getMatchProfile,
  getAllMatchProfiles,
  updateMatchProfile,
  toggleMatchProfileActive,
  checkOnboardingStatus,
} from '../../services/matchProfile.service';

describe('MatchProfile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validUserId = new mongoose.Types.ObjectId('65e9b58910afe6e94fc6e6dc');

  const mockProfile = {
    _id: validUserId,
    userId: validUserId,
    isActive: true,
    age: 20,
    gender: 'FEMALE',
    location: 'NORTH AMERICA',
    programmingLanguage: ['Python', 'JavaScript'],
    level: 'INTERMEDIATE',
    preferences: { preferredLanguages: ['Python'], preferredLevel: 'INTERMEDIATE' },
    onboardingAnswers: {},
    biography: '',
    profileImageUrl: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockInput = {
    userId: validUserId.toString(),
    isActive: false,
    age: 21,
    gender: 'FEMALE',
    location: 'ASIA',
    programmingLanguage: ['TypeScript'],
    level: 'BEGINNER',
    preferences: { preferredLanguages: ['TypeScript'], preferredLevel: 'BEGINNER' },
    onboardingAnswers: { goals: 'learn', personality: 'pair', projectType: 'ml' },
    biography: 'hello',
    profileImageUrl: 'url',
  };

  // ────────────────────────────────────────────────────────────────
  // CREATE MATCH PROFILE
  // ────────────────────────────────────────────────────────────────

  describe('createMatchProfile', () => {
    test('should create a match profile and return populated object', async () => {
      const savedProfile = {
        ...mockInput,
        _id: validUserId,
        userId: validUserId,
        toObject: () => ({
          ...mockInput,
          userId: { _id: validUserId, username: 'testUser' },
        }),
        populate: jest.fn().mockResolvedValue({
          ...mockInput,
          userId: { _id: validUserId, username: 'testUser' },
          toObject() {
            return {
              ...mockInput,
              userId: { _id: validUserId, username: 'testUser' },
            };
          },
        }),
      };

      jest.spyOn(MatchProfileModel.prototype, 'save').mockResolvedValue(savedProfile as any);

      const result = await createMatchProfile(mockInput as any);

      if ('error' in result) {
        throw new Error('Expected success but received error');
      }

      expect(result.userId).toBeDefined();
      expect((result.userId as any).username).toBe('testUser');
      expect(MatchProfileModel.prototype.save).toHaveBeenCalled();
    });

    test('should return error when save throws', async () => {
      jest.spyOn(MatchProfileModel.prototype, 'save').mockRejectedValue(new Error('Save failed'));

      const result = await createMatchProfile(mockInput as any);
      expect(result).toEqual({ error: 'Save failed' });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // GET MATCH PROFILE
  // ────────────────────────────────────────────────────────────────

  describe('getMatchProfile', () => {
    test('should return match profile when found', async () => {
      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: () => ({
          lean: () => mockProfile,
        }),
      } as any);

      const result = await getMatchProfile(validUserId.toString());
      expect(result).toEqual(mockProfile);
      expect(MatchProfileModel.findOne).toHaveBeenCalled();
    });

    test('should return error for invalid ObjectId', async () => {
      const result = await getMatchProfile('invalid-id');
      expect(result).toEqual({ error: 'Invalid userId' });
    });

    test('should return error when not found', async () => {
      jest
        .spyOn(MatchProfileModel, 'findOne')
        .mockReturnValue({ populate: () => ({ lean: () => null }) } as any);

      const result = await getMatchProfile(validUserId.toString());
      expect(result).toEqual({ error: 'Match Profile not found' });
    });

    test('should return error on database failure', async () => {
      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('DB fail')),
      } as any);

      const result = await getMatchProfile(validUserId.toString());
      expect(result).toEqual({ error: 'DB fail' });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // GET ALL MATCH PROFILES
  // ────────────────────────────────────────────────────────────────

  describe('getAllMatchProfiles', () => {
    test('should return list of profiles', async () => {
      jest.spyOn(MatchProfileModel, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProfile]),
      } as any);

      const result = await getAllMatchProfiles();
      expect(result).toEqual([mockProfile]);
    });

    test('should return error when DB fails', async () => {
      jest.spyOn(MatchProfileModel, 'find').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      const result = await getAllMatchProfiles();
      expect(result).toEqual({ error: 'Database error' });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // UPDATE MATCH PROFILE
  // ────────────────────────────────────────────────────────────────

  describe('updateMatchProfile', () => {
    test('should update and return profile', async () => {
      jest.spyOn(MatchProfileModel, 'findOneAndUpdate').mockResolvedValue(mockProfile as any);

      const result = await updateMatchProfile(validUserId.toString(), { age: 22 });
      expect(result).toEqual(mockProfile);
    });

    test('should return error for invalid ObjectId', async () => {
      const result = await updateMatchProfile('invalid', { age: 22 });
      expect(result).toEqual({ error: 'Invalid userId' });
    });

    test('should return error when update fails', async () => {
      jest.spyOn(MatchProfileModel, 'findOneAndUpdate').mockResolvedValue(null);

      const result = await updateMatchProfile(validUserId.toString(), { age: 22 });
      if (!('error' in result)) {
        throw new Error('Expected an error response');
      }

      expect(result.error).toMatch('Error occurred when updating Match Profile');
    });

    test('should return error when DB throws', async () => {
      jest.spyOn(MatchProfileModel, 'findOneAndUpdate').mockRejectedValue(new Error('Fail'));

      const result = await updateMatchProfile(validUserId.toString(), { age: 22 });
      if (!('error' in result)) {
        throw new Error('Expected an error response');
      }

      expect(result.error).toMatch('Error occurred when updating Match Profile');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // TOGGLE ACTIVE
  // ────────────────────────────────────────────────────────────────

  describe('toggleMatchProfileActive', () => {
    test('should call updateMatchProfile with isActive', async () => {
      const spy = jest
        .spyOn(MatchProfileModel, 'findOneAndUpdate')
        .mockResolvedValue({ ...mockProfile, isActive: false } as any);

      const result = await toggleMatchProfileActive(validUserId.toString(), false);

      expect(spy).toHaveBeenCalled();
      if ('error' in result) {
        throw new Error('Expected success but received error');
      }

      expect(result.isActive).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // CHECK ONBOARDING STATUS
  // ────────────────────────────────────────────────────────────────

  describe('checkOnboardingStatus', () => {
    test('should return exists=false if no profile', async () => {
      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await checkOnboardingStatus(validUserId.toString());
      expect(result).toEqual({ exists: false, isActive: false });
    });

    test('should return exists=true and active state', async () => {
      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProfile),
      } as any);

      const result = await checkOnboardingStatus(validUserId.toString());
      expect(result).toEqual({ exists: true, isActive: true });
    });

    test('should return error for invalid userId', async () => {
      const result = await checkOnboardingStatus('invalid-id');
      expect(result).toEqual({ error: 'Invalid userId' });
    });

    test('should return error on database failure', async () => {
      jest.spyOn(MatchProfileModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('DB fail')),
      } as any);

      const result = await checkOnboardingStatus(validUserId.toString());
      expect(result).toEqual({ error: 'Error checking onboarding status: DB fail' });
    });
  });
});
