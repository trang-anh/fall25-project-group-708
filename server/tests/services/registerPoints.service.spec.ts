import mongoose from 'mongoose';
import RegisterPointsModel from '../../models/registerPoints.model';
import addRegisterPoints, {
  hasReceivedUpvotePoints,
  hasReceivedDownvotePenalty,
} from '../../services/registerPoints.service';
import updateDailyPoints from '../../services/dailyPoints.service';
import { updateUserTotalPoints } from '../../services/user.service';
import { DatabaseRegisterPoints } from '../../types/types';

// Mock the dependencies
jest.mock('../../services/dailyPoints.service');
jest.mock('../../services/user.service');

describe('RegisterPoints Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addRegisterPoints', () => {
    const mockUsername = 'testuser';
    const mockQuestionId = new mongoose.Types.ObjectId();
    const mockDate = new Date('2024-01-15T10:30:00Z');

    const createMockRegisterPoints = (
      change_amount: number,
      reason: string,
    ): DatabaseRegisterPoints => ({
      _id: new mongoose.Types.ObjectId(),
      username: mockUsername,
      change_amount,
      reason: reason as any,
      questionId: mockQuestionId,
      createdAt: mockDate,
    });

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    describe('successful point registration', () => {
      test('should successfully register points when gaining points', async () => {
        const mockEntry = createMockRegisterPoints(10, 'UPVOTE_OTHERS');

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 10, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(
          mockUsername,
          10,
          'UPVOTE_OTHERS',
          mockQuestionId.toString(),
        );

        expect(updateDailyPoints).toHaveBeenCalledWith(mockUsername, 10);
        expect(updateUserTotalPoints).toHaveBeenCalledWith(mockUsername, 10);
        expect(RegisterPointsModel.create).toHaveBeenCalledWith({
          username: mockUsername,
          change_amount: 10,
          reason: 'UPVOTE_OTHERS',
          questionId: mockQuestionId.toString(),
          createdAt: expect.any(Date),
        });
        expect(result).toEqual({ applied: 10, blocked: 0, entry: mockEntry });
      });

      test('should successfully register points when losing points', async () => {
        const mockEntry = createMockRegisterPoints(-5, 'HATEFUL_LANGUAGE');

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: -5, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(
          mockUsername,
          -5,
          'HATEFUL_LANGUAGE',
          mockQuestionId.toString(),
        );

        expect(updateDailyPoints).toHaveBeenCalledWith(mockUsername, -5);
        expect(updateUserTotalPoints).toHaveBeenCalledWith(mockUsername, -5);
        expect(result).toEqual({ applied: -5, blocked: 0, entry: mockEntry });
      });

      test('should register points for ACCEPT_ANSWER reason', async () => {
        const mockEntry = createMockRegisterPoints(15, 'ACCEPT_ANSWER');

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 15, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(
          mockUsername,
          15,
          'ACCEPT_ANSWER',
          mockQuestionId.toString(),
        );

        expect(result).toEqual({ applied: 15, blocked: 0, entry: mockEntry });
      });

      test('should register points for POST_QUESTION reason', async () => {
        const mockEntry = createMockRegisterPoints(5, 'POST_QUESTION');

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 5, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(
          mockUsername,
          5,
          'POST_QUESTION',
          mockQuestionId.toString(),
        );

        expect(result).toEqual({ applied: 5, blocked: 0, entry: mockEntry });
      });

      test('should register points for RECEIVE_DOWNVOTES reason', async () => {
        const mockEntry = createMockRegisterPoints(-2, 'RECEIVE_DOWNVOTES');

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: -2, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(
          mockUsername,
          -2,
          'RECEIVE_DOWNVOTES',
          mockQuestionId.toString(),
        );

        expect(result).toEqual({ applied: -2, blocked: 0, entry: mockEntry });
      });

      test('should work without questionId (optional parameter)', async () => {
        const mockEntry = {
          ...createMockRegisterPoints(10, 'UPVOTE_OTHERS'),
          questionId: undefined,
        };

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 10, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(mockUsername, 10, 'UPVOTE_OTHERS');

        expect(RegisterPointsModel.create).toHaveBeenCalledWith({
          username: mockUsername,
          change_amount: 10,
          reason: 'UPVOTE_OTHERS',
          questionId: undefined,
          createdAt: expect.any(Date),
        });
        expect(result).toEqual({ applied: 10, blocked: 0, entry: mockEntry });
      });
    });

    describe('partial application due to daily limit', () => {
      test('should register partial points when daily limit is partially hit', async () => {
        const mockEntry = createMockRegisterPoints(5, 'UPVOTE_OTHERS');

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 5, blocked: 5 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(
          mockUsername,
          10,
          'UPVOTE_OTHERS',
          mockQuestionId.toString(),
        );

        expect(updateUserTotalPoints).toHaveBeenCalledWith(mockUsername, 5);
        expect(RegisterPointsModel.create).toHaveBeenCalledWith({
          username: mockUsername,
          change_amount: 5,
          reason: 'UPVOTE_OTHERS',
          questionId: mockQuestionId.toString(),
          createdAt: expect.any(Date),
        });
        expect(result).toEqual({ applied: 5, blocked: 5, entry: mockEntry });
      });

      test('should register partial loss when daily loss limit is partially hit', async () => {
        const mockEntry = createMockRegisterPoints(-3, 'HATEFUL_LANGUAGE');

        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: -3, blocked: 7 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(mockEntry as any);

        const result = await addRegisterPoints(
          mockUsername,
          -10,
          'HATEFUL_LANGUAGE',
          mockQuestionId.toString(),
        );

        expect(updateUserTotalPoints).toHaveBeenCalledWith(mockUsername, -3);
        expect(result).toEqual({ applied: -3, blocked: 7, entry: mockEntry });
      });
    });

    describe('daily limit reached', () => {
      test('should return early when daily gain limit is reached', async () => {
        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 0, blocked: 10 });
        const createSpy = jest.spyOn(RegisterPointsModel, 'create');

        const result = await addRegisterPoints(
          mockUsername,
          10,
          'UPVOTE_OTHERS',
          mockQuestionId.toString(),
        );

        expect(updateDailyPoints).toHaveBeenCalledWith(mockUsername, 10);
        expect(updateUserTotalPoints).not.toHaveBeenCalled();
        expect(createSpy).not.toHaveBeenCalled();
        expect(result).toEqual({ applied: 0, blocked: 10, message: 'Daily limit reached' });

        createSpy.mockRestore();
      });

      test('should return early when daily loss limit is reached', async () => {
        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 0, blocked: 5 });
        const createSpy = jest.spyOn(RegisterPointsModel, 'create');

        const result = await addRegisterPoints(
          mockUsername,
          -5,
          'RECEIVE_DOWNVOTES',
          mockQuestionId.toString(),
        );

        expect(updateUserTotalPoints).not.toHaveBeenCalled();
        expect(createSpy).not.toHaveBeenCalled();
        expect(result).toEqual({ applied: 0, blocked: 5, message: 'Daily limit reached' });

        createSpy.mockRestore();
      });
    });

    describe('error handling', () => {
      test('should return error when updateDailyPoints fails', async () => {
        (updateDailyPoints as jest.Mock).mockRejectedValue(new Error('Database error'));

        const result = await addRegisterPoints(
          mockUsername,
          10,
          'UPVOTE_OTHERS',
          mockQuestionId.toString(),
        );

        expect(result).toEqual({ error: 'Database error' });
      });

      test('should return error when updateUserTotalPoints fails', async () => {
        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 10, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockRejectedValue(new Error('User update failed'));

        const result = await addRegisterPoints(
          mockUsername,
          10,
          'UPVOTE_OTHERS',
          mockQuestionId.toString(),
        );

        expect(result).toEqual({ error: 'User update failed' });
      });

      test('should return error when RegisterPointsModel.create fails', async () => {
        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 10, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockResolvedValue(null as any);

        const result = await addRegisterPoints(
          mockUsername,
          10,
          'UPVOTE_OTHERS',
          mockQuestionId.toString(),
        );

        expect(result).toEqual({ error: 'Failed to add new entry to Register Points' });
      });

      test('should return error when RegisterPointsModel.create throws', async () => {
        (updateDailyPoints as jest.Mock).mockResolvedValue({ applied: 10, blocked: 0 });
        (updateUserTotalPoints as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(RegisterPointsModel, 'create').mockRejectedValue(new Error('Create failed'));

        const result = await addRegisterPoints(
          mockUsername,
          10,
          'UPVOTE_OTHERS',
          mockQuestionId.toString(),
        );

        expect(result).toEqual({ error: 'Create failed' });
      });
    });
  });

  describe('hasReceivedUpvotePoints', () => {
    const mockUsername = 'testuser';
    const mockQuestionId = new mongoose.Types.ObjectId();

    test('should return true when user has received upvote points for the question', async () => {
      const mockEntry: DatabaseRegisterPoints = {
        _id: new mongoose.Types.ObjectId(),
        username: mockUsername,
        change_amount: 10,
        reason: 'UPVOTE_OTHERS',
        questionId: mockQuestionId,
        createdAt: new Date(),
      };

      jest.spyOn(RegisterPointsModel, 'findOne').mockResolvedValue(mockEntry);

      const result = await hasReceivedUpvotePoints(mockUsername, mockQuestionId.toString());

      expect(RegisterPointsModel.findOne).toHaveBeenCalledWith({
        username: mockUsername,
        reason: 'UPVOTE_OTHERS',
        questionId: mockQuestionId.toString(),
      });
      expect(result).toBe(true);
    });

    test('should return false when user has not received upvote points for the question', async () => {
      jest.spyOn(RegisterPointsModel, 'findOne').mockResolvedValue(null);

      const result = await hasReceivedUpvotePoints(mockUsername, mockQuestionId.toString());

      expect(result).toBe(false);
    });

    test('should query with correct parameters', async () => {
      jest.spyOn(RegisterPointsModel, 'findOne').mockResolvedValue(null);

      await hasReceivedUpvotePoints('user123', 'question456');

      expect(RegisterPointsModel.findOne).toHaveBeenCalledWith({
        username: 'user123',
        reason: 'UPVOTE_OTHERS',
        questionId: 'question456',
      });
    });
  });

  describe('hasReceivedDownvotePenalty', () => {
    const mockUsername = 'testuser';
    const mockQuestionId = new mongoose.Types.ObjectId();

    test('should return true when user has been penalized for downvote on the question', async () => {
      const mockEntry: DatabaseRegisterPoints = {
        _id: new mongoose.Types.ObjectId(),
        username: mockUsername,
        change_amount: -2,
        reason: 'RECEIVE_DOWNVOTES',
        questionId: mockQuestionId,
        createdAt: new Date(),
      };

      jest.spyOn(RegisterPointsModel, 'findOne').mockResolvedValue(mockEntry);

      const result = await hasReceivedDownvotePenalty(mockUsername, mockQuestionId.toString());

      expect(RegisterPointsModel.findOne).toHaveBeenCalledWith({
        username: mockUsername,
        reason: 'RECEIVE_DOWNVOTES',
        questionId: mockQuestionId.toString(),
      });
      expect(result).toBe(true);
    });

    test('should return false when user has not been penalized for downvote on the question', async () => {
      jest.spyOn(RegisterPointsModel, 'findOne').mockResolvedValue(null);

      const result = await hasReceivedDownvotePenalty(mockUsername, mockQuestionId.toString());

      expect(result).toBe(false);
    });

    test('should query with correct parameters', async () => {
      jest.spyOn(RegisterPointsModel, 'findOne').mockResolvedValue(null);

      await hasReceivedDownvotePenalty('user456', 'question789');

      expect(RegisterPointsModel.findOne).toHaveBeenCalledWith({
        username: 'user456',
        reason: 'RECEIVE_DOWNVOTES',
        questionId: 'question789',
      });
    });
  });
});
