import mongoose from 'mongoose';
import DailyPointsModel from '../../models/dailyPoints.model';
import updateDailyPoints from '../../services/dailyPoints.service';
import { DatabaseDailyPoints } from '../../types/types';

describe('DailyPoints Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateDailyPoints', () => {
    const mockUsername = 'testuser';
    const mockDate = new Date('2024-01-15T10:30:00Z');

    // Mock dates for consistent testing
    const todayStart = new Date(mockDate);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const createMockDailyPoints = (
      total_gained: number = 0,
      total_lost: number = 0,
      net_change: number = 0,
    ): DatabaseDailyPoints => ({
      _id: new mongoose.Types.ObjectId(),
      username: mockUsername,
      date: todayStart,
      total_gained,
      total_lost,
      net_change,
    });

    beforeEach(() => {
      // Mock the Date constructor to return a consistent date
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    describe('when no daily record exists', () => {
      test('should create a new daily record when gaining points', async () => {
        const newRecord = createMockDailyPoints();
        const updatedRecord = createMockDailyPoints(10, 0, 10);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(DailyPointsModel, 'create').mockResolvedValue(newRecord as any);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, 10);

        expect(DailyPointsModel.create).toHaveBeenCalledWith({
          username: mockUsername,
          date: expect.any(Date),
          total_gained: 0,
          total_lost: 0,
          net_change: 0,
        });
        expect(result).toEqual({ applied: 10, blocked: 0 });
      });

      test('should create a new daily record when losing points', async () => {
        const newRecord = createMockDailyPoints();
        const updatedRecord = createMockDailyPoints(0, 5, -5);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(null);
        jest.spyOn(DailyPointsModel, 'create').mockResolvedValue(newRecord as any);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, -5);

        expect(DailyPointsModel.create).toHaveBeenCalled();
        expect(result).toEqual({ applied: -5, blocked: 0 });
      });
    });

    describe('when gaining points (positive change)', () => {
      test('should apply full points when under the 30 cap', async () => {
        const existingRecord = createMockDailyPoints(10, 0, 10);
        const updatedRecord = createMockDailyPoints(20, 0, 20);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, 10);

        expect(DailyPointsModel.findByIdAndUpdate).toHaveBeenCalledWith(
          existingRecord._id,
          {
            $inc: {
              total_gained: 10,
              net_change: 10,
            },
          },
          { new: true },
        );
        expect(result).toEqual({ applied: 10, blocked: 0 });
      });

      test('should apply partial points when exceeding the 30 cap', async () => {
        const existingRecord = createMockDailyPoints(25, 0, 25);
        const updatedRecord = createMockDailyPoints(30, 0, 30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, 10);

        expect(DailyPointsModel.findByIdAndUpdate).toHaveBeenCalledWith(
          existingRecord._id,
          {
            $inc: {
              total_gained: 5,
              net_change: 5,
            },
          },
          { new: true },
        );
        expect(result).toEqual({ applied: 5, blocked: 5 });
      });

      test('should block all points when already at 30 cap', async () => {
        const existingRecord = createMockDailyPoints(30, 0, 30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(existingRecord);

        const result = await updateDailyPoints(mockUsername, 10);

        expect(DailyPointsModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(result).toEqual({ applied: 0, blocked: 10 });
      });

      test('should apply exactly to cap when points equal remaining', async () => {
        const existingRecord = createMockDailyPoints(20, 0, 20);
        const updatedRecord = createMockDailyPoints(30, 0, 30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, 10);

        expect(result).toEqual({ applied: 10, blocked: 0 });
      });

      test('should handle gaining 1 point', async () => {
        const existingRecord = createMockDailyPoints(0, 0, 0);
        const updatedRecord = createMockDailyPoints(1, 0, 1);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, 1);

        expect(result).toEqual({ applied: 1, blocked: 0 });
      });
    });

    describe('when losing points (negative change)', () => {
      test('should apply full loss when under the 30 cap', async () => {
        const existingRecord = createMockDailyPoints(0, 10, -10);
        const updatedRecord = createMockDailyPoints(0, 20, -20);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, -10);

        expect(DailyPointsModel.findByIdAndUpdate).toHaveBeenCalledWith(
          existingRecord._id,
          {
            $inc: {
              total_lost: 10,
              net_change: -10,
            },
          },
          { new: true },
        );
        expect(result).toEqual({ applied: -10, blocked: 0 });
      });

      test('should apply partial loss when exceeding the 30 cap', async () => {
        const existingRecord = createMockDailyPoints(0, 25, -25);
        const updatedRecord = createMockDailyPoints(0, 30, -30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, -10);

        expect(DailyPointsModel.findByIdAndUpdate).toHaveBeenCalledWith(
          existingRecord._id,
          {
            $inc: {
              total_lost: 5,
              net_change: -5,
            },
          },
          { new: true },
        );
        expect(result).toEqual({ applied: -5, blocked: 5 });
      });

      test('should block all losses when already at 30 cap', async () => {
        const existingRecord = createMockDailyPoints(0, 30, -30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(existingRecord);

        const result = await updateDailyPoints(mockUsername, -10);

        expect(DailyPointsModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(result).toEqual({ applied: 0, blocked: 10 });
      });

      test('should apply exactly to cap when loss equals remaining', async () => {
        const existingRecord = createMockDailyPoints(0, 20, -20);
        const updatedRecord = createMockDailyPoints(0, 30, -30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, -10);

        expect(result).toEqual({ applied: -10, blocked: 0 });
      });

      test('should handle losing 1 point', async () => {
        const existingRecord = createMockDailyPoints(0, 0, 0);
        const updatedRecord = createMockDailyPoints(0, 1, -1);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, -1);

        expect(result).toEqual({ applied: -1, blocked: 0 });
      });
    });

    describe('when points change is zero', () => {
      test('should return applied: 0, blocked: 0 without updating', async () => {
        const existingRecord = createMockDailyPoints(10, 5, 5);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(existingRecord);

        const result = await updateDailyPoints(mockUsername, 0);

        expect(DailyPointsModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(result).toEqual({ applied: 0, blocked: 0 });
      });
    });

    describe('mixed gains and losses', () => {
      test('should handle user with both gains and losses separately', async () => {
        const existingRecord = createMockDailyPoints(15, 10, 5);
        const updatedRecord = createMockDailyPoints(25, 10, 15);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, 10);

        expect(result).toEqual({ applied: 10, blocked: 0 });
      });
    });

    describe('date range query', () => {
      test('should query for records within today only', async () => {
        const existingRecord = createMockDailyPoints();

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(existingRecord);

        await updateDailyPoints(mockUsername, 5);

        expect(DailyPointsModel.findOne).toHaveBeenCalledWith({
          username: mockUsername,
          date: { $gte: expect.any(Date), $lt: expect.any(Date) },
        });
      });
    });

    describe('edge cases', () => {
      test('should handle large point values beyond cap', async () => {
        const existingRecord = createMockDailyPoints(0, 0, 0);
        const updatedRecord = createMockDailyPoints(30, 0, 30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, 100);

        expect(result).toEqual({ applied: 30, blocked: 70 });
      });

      test('should handle large loss values beyond cap', async () => {
        const existingRecord = createMockDailyPoints(0, 0, 0);
        const updatedRecord = createMockDailyPoints(0, 30, -30);

        jest.spyOn(DailyPointsModel, 'findOne').mockResolvedValue(existingRecord);
        jest.spyOn(DailyPointsModel, 'findByIdAndUpdate').mockResolvedValue(updatedRecord);

        const result = await updateDailyPoints(mockUsername, -100);

        expect(result).toEqual({ applied: -30, blocked: 70 });
      });
    });
  });
});
