import { Response } from 'express';
import { uploadAvatar, deleteAvatar } from '../../controllers/avatar.controller';
import { uploadAvatarService, deleteAvatarService } from '../../services/avatar.service';
import {
  AvatarUploadRequest,
  AvatarDeleteRequest,
  AvatarUploadResponse,
  AvatarDeleteResponse,
} from '../../types/types';
import { ObjectId } from 'mongodb';

// Mock dependencies
jest.mock('../../services/avatar.service');

describe('Avatar Controller', () => {
  let mockUploadRequest: Partial<AvatarUploadRequest>;
  let mockDeleteRequest: Partial<AvatarDeleteRequest>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockUsername = 'testuser';
  const mockAvatarUrl = '/uploads/avatar/test-avatar.jpg';

  const mockFile: Express.Multer.File = {
    fieldname: 'avatar',
    originalname: 'avatar.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: '/tmp/uploads',
    filename: 'test-avatar.jpg',
    path: '/tmp/uploads/test-avatar.jpg',
    size: 12345,
    buffer: Buffer.from(''),
    stream: {} as any,
  };

  const mockUser = {
    _id: new ObjectId(),
    username: mockUsername,
    dateJoined: new Date('2024-01-01'),
    biography: 'Test bio',
    totalPoints: 100,
    avatarUrl: mockAvatarUrl,
  };

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('uploadAvatar', () => {
    beforeEach(() => {
      mockUploadRequest = {
        body: { username: mockUsername },
        file: mockFile,
      };
    });

    it('should successfully upload an avatar', async () => {
      const mockServiceResponse = {
        avatarUrl: mockAvatarUrl,
        user: mockUser,
      };

      (uploadAvatarService as jest.Mock).mockResolvedValue(mockServiceResponse);

      await uploadAvatar(
        mockUploadRequest as AvatarUploadRequest,
        mockResponse as Response<AvatarUploadResponse | { error: string }>,
      );

      expect(uploadAvatarService).toHaveBeenCalledWith(mockUsername, mockFile);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Avatar uploaded successfully',
        avatarUrl: mockAvatarUrl,
        user: mockUser,
      });
    });

    it('should return 400 if no file is uploaded', async () => {
      mockUploadRequest.file = undefined;

      await uploadAvatar(
        mockUploadRequest as AvatarUploadRequest,
        mockResponse as Response<AvatarUploadResponse | { error: string }>,
      );

      expect(uploadAvatarService).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('should return 401 if username is not provided', async () => {
      mockUploadRequest.body = { username: '' };

      await uploadAvatar(
        mockUploadRequest as AvatarUploadRequest,
        mockResponse as Response<AvatarUploadResponse | { error: string }>,
      );

      expect(uploadAvatarService).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 401 if username is undefined', async () => {
      mockUploadRequest.body = { username: undefined as any };

      await uploadAvatar(
        mockUploadRequest as AvatarUploadRequest,
        mockResponse as Response<AvatarUploadResponse | { error: string }>,
      );

      expect(uploadAvatarService).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 500 if service throws an error', async () => {
      (uploadAvatarService as jest.Mock).mockRejectedValue(new Error('Service error'));

      await uploadAvatar(
        mockUploadRequest as AvatarUploadRequest,
        mockResponse as Response<AvatarUploadResponse | { error: string }>,
      );

      expect(uploadAvatarService).toHaveBeenCalledWith(mockUsername, mockFile);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to upload avatar' });
    });

    it('should return 500 if service throws user not found error', async () => {
      (uploadAvatarService as jest.Mock).mockRejectedValue(new Error('User not found'));

      await uploadAvatar(
        mockUploadRequest as AvatarUploadRequest,
        mockResponse as Response<AvatarUploadResponse | { error: string }>,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to upload avatar' });
    });
  });

  describe('deleteAvatar', () => {
    beforeEach(() => {
      mockDeleteRequest = {
        body: { username: mockUsername },
      };
    });

    it('should successfully delete an avatar', async () => {
      (deleteAvatarService as jest.Mock).mockResolvedValue(mockUser);

      await deleteAvatar(
        mockDeleteRequest as AvatarDeleteRequest,
        mockResponse as Response<AvatarDeleteResponse | { error: string }>,
      );

      expect(deleteAvatarService).toHaveBeenCalledWith(mockUsername);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Avatar deleted successfully',
      });
    });

    it('should return 401 if username is not provided', async () => {
      mockDeleteRequest.body = { username: '' };

      await deleteAvatar(
        mockDeleteRequest as AvatarDeleteRequest,
        mockResponse as Response<AvatarDeleteResponse | { error: string }>,
      );

      expect(deleteAvatarService).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 401 if username is undefined', async () => {
      mockDeleteRequest.body = { username: undefined as any };

      await deleteAvatar(
        mockDeleteRequest as AvatarDeleteRequest,
        mockResponse as Response<AvatarDeleteResponse | { error: string }>,
      );

      expect(deleteAvatarService).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 500 if service throws an error', async () => {
      (deleteAvatarService as jest.Mock).mockRejectedValue(new Error('Service error'));

      await deleteAvatar(
        mockDeleteRequest as AvatarDeleteRequest,
        mockResponse as Response<AvatarDeleteResponse | { error: string }>,
      );

      expect(deleteAvatarService).toHaveBeenCalledWith(mockUsername);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to delete avatar' });
    });

    it('should return 500 if service throws user not found error', async () => {
      (deleteAvatarService as jest.Mock).mockRejectedValue(new Error('User not found'));

      await deleteAvatar(
        mockDeleteRequest as AvatarDeleteRequest,
        mockResponse as Response<AvatarDeleteResponse | { error: string }>,
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to delete avatar' });
    });

    it('should handle null username', async () => {
      mockDeleteRequest.body = { username: null as any };

      await deleteAvatar(
        mockDeleteRequest as AvatarDeleteRequest,
        mockResponse as Response<AvatarDeleteResponse | { error: string }>,
      );

      expect(deleteAvatarService).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });
});
