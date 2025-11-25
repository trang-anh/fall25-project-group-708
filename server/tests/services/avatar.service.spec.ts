import { uploadAvatarService, deleteAvatarService } from '../../services/avatar.service';
import UserModel, { UserDocument } from '../../models/users.model';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('../../models/users.model');
jest.mock('fs');
jest.mock('path');

describe('Avatar Service', () => {
  const mockUsername = 'testuser';
  const mockAvatarUrl = '/uploads/avatar/test-avatar.jpg';
  const mockOldAvatarUrl = '/uploads/avatar/old-avatar.jpg';
  const mockFilePath = '/tmp/uploads/test-avatar.jpg';

  const mockFile: Express.Multer.File = {
    fieldname: 'avatar',
    originalname: 'avatar.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: '/tmp/uploads',
    filename: 'test-avatar.jpg',
    path: mockFilePath,
    size: 12345,
    buffer: Buffer.from(''),
    stream: {} as any,
  };

  const mockUserDocument = {
    _id: new ObjectId(),
    username: mockUsername,
    password: 'hashedpassword',
    dateJoined: new Date('2024-01-01'),
    biography: 'Test bio',
    totalPoints: 100,
    avatarUrl: '',
    save: jest.fn(),
  } as unknown as UserDocument;

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  describe('uploadAvatarService', () => {
    it('should successfully upload an avatar for an existing user', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUserDocument);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await uploadAvatarService(mockUsername, mockFile);

      expect(UserModel.findOne).toHaveBeenCalledWith({ username: mockUsername });
      expect(mockUserDocument.avatarUrl).toBe(mockAvatarUrl);
      expect(mockUserDocument.save).toHaveBeenCalled();
      expect(result).toEqual({
        avatarUrl: mockAvatarUrl,
        user: {
          _id: mockUserDocument._id,
          username: mockUserDocument.username,
          dateJoined: mockUserDocument.dateJoined,
          biography: mockUserDocument.biography,
          githubId: undefined,
          totalPoints: mockUserDocument.totalPoints,
          avatarUrl: mockAvatarUrl,
        },
      });
    });

    it('should delete the uploaded file and throw error when user is not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      await expect(uploadAvatarService(mockUsername, mockFile)).rejects.toThrow('User not found');

      expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFilePath);
      expect(mockUserDocument.save).not.toHaveBeenCalled();
    });

    it('should not attempt to delete uploaded file if it does not exist', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(uploadAvatarService(mockUsername, mockFile)).rejects.toThrow('User not found');

      expect(fs.existsSync).toHaveBeenCalledWith(mockFilePath);
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should delete the old avatar file when uploading a new one', async () => {
      const userWithOldAvatar = {
        ...mockUserDocument,
        avatarUrl: mockOldAvatarUrl,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithOldAvatar);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      await uploadAvatarService(mockUsername, mockFile);

      const expectedOldPath = `${process.cwd()}/${mockOldAvatarUrl}`;
      expect(fs.existsSync).toHaveBeenCalledWith(expectedOldPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(expectedOldPath);
    });

    it('should not delete old avatar if it does not exist on filesystem', async () => {
      const userWithOldAvatar = {
        ...mockUserDocument,
        avatarUrl: mockOldAvatarUrl,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithOldAvatar);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await uploadAvatarService(mockUsername, mockFile);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should continue successfully even if deleting old avatar fails', async () => {
      const userWithOldAvatar = {
        ...mockUserDocument,
        avatarUrl: mockOldAvatarUrl,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithOldAvatar);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await uploadAvatarService(mockUsername, mockFile);

      expect(result).toEqual({
        avatarUrl: mockAvatarUrl,
        user: expect.objectContaining({
          username: mockUsername,
          avatarUrl: mockAvatarUrl,
        }),
      });
    });

    it('should not attempt to delete old avatar if avatarUrl is empty', async () => {
      const userWithNoAvatar = {
        ...mockUserDocument,
        avatarUrl: '',
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithNoAvatar);

      await uploadAvatarService(mockUsername, mockFile);

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should not delete old avatar if new avatar URL is the same', async () => {
      const userWithSameAvatar = {
        ...mockUserDocument,
        avatarUrl: mockAvatarUrl,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithSameAvatar);

      await uploadAvatarService(mockUsername, mockFile);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('deleteAvatarService', () => {
    it('should successfully delete avatar for an existing user', async () => {
      const userWithAvatar = {
        ...mockUserDocument,
        avatarUrl: mockAvatarUrl,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithAvatar);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});

      const result = await deleteAvatarService(mockUsername);

      expect(UserModel.findOne).toHaveBeenCalledWith({ username: mockUsername });

      const expectedPath = `${process.cwd()}/${mockAvatarUrl}`;
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(expectedPath);

      expect(userWithAvatar.avatarUrl).toBe('');
      expect(userWithAvatar.save).toHaveBeenCalled();

      expect(result).toEqual({
        _id: userWithAvatar._id,
        username: userWithAvatar.username,
        dateJoined: userWithAvatar.dateJoined,
        biography: userWithAvatar.biography,
        githubId: undefined,
        totalPoints: userWithAvatar.totalPoints,
        avatarUrl: '',
      });
    });

    it('should throw error when user is not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(deleteAvatarService(mockUsername)).rejects.toThrow('User not found');

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should clear avatarUrl even if user has no avatar', async () => {
      const userWithNoAvatar = {
        ...mockUserDocument,
        avatarUrl: undefined,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithNoAvatar);

      const result = await deleteAvatarService(mockUsername);

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(userWithNoAvatar.avatarUrl).toBe('');
      expect(userWithNoAvatar.save).toHaveBeenCalled();
      expect(result.avatarUrl).toBe('');
    });

    it('should not delete file if avatar file does not exist on filesystem', async () => {
      const userWithAvatar = {
        ...mockUserDocument,
        avatarUrl: mockAvatarUrl,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithAvatar);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await deleteAvatarService(mockUsername);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(userWithAvatar.avatarUrl).toBe('');
      expect(userWithAvatar.save).toHaveBeenCalled();
    });

    it('should clear avatarUrl even if file deletion fails', async () => {
      const userWithAvatar = {
        ...mockUserDocument,
        avatarUrl: mockAvatarUrl,
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithAvatar);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await deleteAvatarService(mockUsername);

      expect(userWithAvatar.avatarUrl).toBe('');
      expect(userWithAvatar.save).toHaveBeenCalled();
      expect(result.avatarUrl).toBe('');
    });

    it('should handle empty string avatarUrl gracefully', async () => {
      const userWithEmptyAvatar = {
        ...mockUserDocument,
        avatarUrl: '',
      } as unknown as UserDocument;

      (UserModel.findOne as jest.Mock).mockResolvedValue(userWithEmptyAvatar);

      await deleteAvatarService(mockUsername);

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(userWithEmptyAvatar.save).toHaveBeenCalled();
    });
  });
});
