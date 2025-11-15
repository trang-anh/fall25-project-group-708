import mongoose from 'mongoose';
import NotDuplicateQuestionModel from '../../models/notDuplicateQuestion.model';
import saveNotDuplicateQuestion from '../../services/notDuplicateQuestion.service';
import { DatabaseNotDuplicateQuestion, NotDuplicateQuestion } from '../../types/types';

describe('NotDuplicateQuestion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveNotDuplicateQuestion', () => {
    const mockNotDuplicateQuestion: NotDuplicateQuestion = {
      username: 'user123',
      question: new mongoose.Types.ObjectId(),
      //2 duplicate questions
      duplicateOf: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      justification: 'These questions are about different topics entirely',
      createdAt: new Date('2024-01-15T10:30:00Z'),
    };

    const mockDatabaseNotDuplicateQuestion: DatabaseNotDuplicateQuestion = {
      _id: new mongoose.Types.ObjectId(),
      ...mockNotDuplicateQuestion,
    };

    test('saveNotDuplicateQuestion should return the saved record', async () => {
      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValueOnce(mockDatabaseNotDuplicateQuestion as any);

      const result = (await saveNotDuplicateQuestion(
        mockNotDuplicateQuestion,
      )) as DatabaseNotDuplicateQuestion;

      expect(result._id).toBeDefined();
      expect(result.username).toEqual(mockNotDuplicateQuestion.username);
      expect(result.question).toEqual(mockNotDuplicateQuestion.question);
      expect(result.duplicateOf).toEqual(mockNotDuplicateQuestion.duplicateOf);
      expect(result.justification).toEqual(mockNotDuplicateQuestion.justification);
      expect(result.createdAt).toEqual(mockNotDuplicateQuestion.createdAt);
    });

    test('saveNotDuplicateQuestion should return an object with error if create throws an error', async () => {
      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockRejectedValue(new Error('Error from db query'));

      const result = await saveNotDuplicateQuestion(mockNotDuplicateQuestion);

      expect(result).toEqual({ error: 'Error when saving a question' });
    });

    test('saveNotDuplicateQuestion should handle empty duplicateOf array', async () => {
      const emptyDuplicatesRecord = {
        ...mockNotDuplicateQuestion,
        duplicateOf: [],
      };

      const expectedResult = {
        _id: new mongoose.Types.ObjectId(),
        ...emptyDuplicatesRecord,
      };

      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValue(
          expectedResult as unknown as ReturnType<typeof NotDuplicateQuestionModel.create>,
        );

      const result = (await saveNotDuplicateQuestion(
        emptyDuplicatesRecord,
      )) as DatabaseNotDuplicateQuestion;

      expect(result.duplicateOf).toEqual([]);
      expect(result.duplicateOf.length).toEqual(0);
    });

    test('saveNotDuplicateQuestion should handle single item in duplicateOf array', async () => {
      const singleDuplicateRecord = {
        ...mockNotDuplicateQuestion,
        duplicateOf: [new mongoose.Types.ObjectId()],
      };

      const expectedResult = {
        _id: new mongoose.Types.ObjectId(),
        ...singleDuplicateRecord,
      };

      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValue(
          expectedResult as unknown as ReturnType<typeof NotDuplicateQuestionModel.create>,
        );

      const result = (await saveNotDuplicateQuestion(
        singleDuplicateRecord,
      )) as DatabaseNotDuplicateQuestion;

      expect(result.duplicateOf.length).toEqual(1);
      expect(result.duplicateOf[0]).toEqual(singleDuplicateRecord.duplicateOf[0]);
    });

    test('saveNotDuplicateQuestion should handle multiple items in duplicateOf array', async () => {
      const multipleDuplicatesRecord = {
        ...mockNotDuplicateQuestion,
        duplicateOf: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
        ],
      };

      const expectedResult = {
        _id: new mongoose.Types.ObjectId(),
        ...multipleDuplicatesRecord,
      };

      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValue(
          expectedResult as unknown as ReturnType<typeof NotDuplicateQuestionModel.create>,
        );

      const result = (await saveNotDuplicateQuestion(
        multipleDuplicatesRecord,
      )) as DatabaseNotDuplicateQuestion;

      expect(result.duplicateOf.length).toEqual(4);
      expect(result.duplicateOf).toEqual(multipleDuplicatesRecord.duplicateOf);
    });

    test('saveNotDuplicateQuestion should save record with minimal justification text', async () => {
      const minimalJustification = {
        ...mockNotDuplicateQuestion,
        justification: 'Different',
      };

      const expectedResult = {
        _id: new mongoose.Types.ObjectId(),
        ...minimalJustification,
      };

      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValue(
          expectedResult as unknown as ReturnType<typeof NotDuplicateQuestionModel.create>,
        );

      const result = (await saveNotDuplicateQuestion(
        minimalJustification,
      )) as DatabaseNotDuplicateQuestion;

      expect(result.justification).toEqual('Different');
      expect(result._id).toBeDefined();
    });

    test('saveNotDuplicateQuestion should save record with long justification text', async () => {
      const longJustification = {
        ...mockNotDuplicateQuestion,
        justification: 'A'.repeat(1000),
      };

      const expectedResult = {
        _id: new mongoose.Types.ObjectId(),
        ...longJustification,
      };

      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValue(
          expectedResult as unknown as ReturnType<typeof NotDuplicateQuestionModel.create>,
        );

      const result = (await saveNotDuplicateQuestion(
        longJustification,
      )) as DatabaseNotDuplicateQuestion;

      expect(result.justification).toEqual('A'.repeat(1000));
      expect(result.justification.length).toEqual(1000);
    });

    test('saveNotDuplicateQuestion should preserve createdAt timestamp accurately', async () => {
      const specificDate = new Date('2024-12-25T15:45:30.123Z');
      const recordWithSpecificDate = {
        ...mockNotDuplicateQuestion,
        createdAt: specificDate,
      };

      const expectedResult = {
        _id: new mongoose.Types.ObjectId(),
        ...recordWithSpecificDate,
      };

      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValue(
          expectedResult as unknown as ReturnType<typeof NotDuplicateQuestionModel.create>,
        );

      const result = (await saveNotDuplicateQuestion(
        recordWithSpecificDate,
      )) as DatabaseNotDuplicateQuestion;

      expect(result.createdAt).toEqual(specificDate);
      expect(result.createdAt.toISOString()).toEqual('2024-12-25T15:45:30.123Z');
    });

    test('saveNotDuplicateQuestion should handle database connection errors', async () => {
      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockRejectedValue(new Error('Database connection failed'));

      const result = await saveNotDuplicateQuestion(mockNotDuplicateQuestion);

      expect(result).toEqual({ error: 'Error when saving a question' });
    });

    test('saveNotDuplicateQuestion should handle validation errors', async () => {
      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockRejectedValue(new Error('Validation failed'));

      const result = await saveNotDuplicateQuestion(mockNotDuplicateQuestion);

      expect(result).toEqual({ error: 'Error when saving a question' });
    });

    test('saveNotDuplicateQuestion should handle different usernames', async () => {
      const differentUsernameRecord = {
        ...mockNotDuplicateQuestion,
        username: 'different_user_456',
      };

      const expectedResult = {
        _id: new mongoose.Types.ObjectId(),
        ...differentUsernameRecord,
      };

      jest
        .spyOn(NotDuplicateQuestionModel, 'create')
        .mockResolvedValue(
          expectedResult as unknown as ReturnType<typeof NotDuplicateQuestionModel.create>,
        );

      const result = (await saveNotDuplicateQuestion(
        differentUsernameRecord,
      )) as DatabaseNotDuplicateQuestion;

      expect(result.username).toEqual('different_user_456');
    });
  });
});
