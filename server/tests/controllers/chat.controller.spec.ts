import mongoose from 'mongoose';
import supertest from 'supertest';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { createServer } from 'http';
import { io as Client, type Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { app } from '../../app';
import * as messageService from '../../services/message.service';
import * as chatService from '../../services/chat.service';
import * as databaseUtil from '../../utils/database.util';
import { DatabaseChat, PopulatedDatabaseChat, Message } from '../../types/types';
import chatController from '../../controllers/chat.controller';

/**
 * Spies on the service functions
 */
const saveChatSpy = jest.spyOn(chatService, 'saveChat');
const saveMessageSpy = jest.spyOn(messageService, 'saveMessage');
const addMessageSpy = jest.spyOn(chatService, 'addMessageToChat');
const getChatSpy = jest.spyOn(chatService, 'getChat');
const addParticipantSpy = jest.spyOn(chatService, 'addParticipantToChat');
const removeParticipantSpy = jest.spyOn(chatService, 'removeParticipantFromChat');
const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');
const getChatsByParticipantsSpy = jest.spyOn(chatService, 'getChatsByParticipants');

/**
 * Sample test suite for the /chat endpoints
 */
describe('Chat Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /chat/createChat', () => {
    it('should create a new chat successfully', async () => {
      const validChatPayload = {
        participants: ['user1', 'user2'],
        messages: [{ msg: 'Hello!', msgFrom: 'user1', msgDateTime: new Date('2025-01-01') }],
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [new mongoose.Types.ObjectId()],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChatResponse: PopulatedDatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [
          {
            _id: chatResponse.messages[0],
            msg: 'Hello!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
              avatarUrl: '',
            },
            type: 'direct',
          },
        ],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChatResponse);

      const response = await supertest(app).post('/api/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        _id: populatedChatResponse._id.toString(),
        participants: populatedChatResponse.participants.map(participant => participant.toString()),
        messages: populatedChatResponse.messages.map(message => ({
          ...message,
          _id: message._id.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user?._id.toString(),
          },
        })),
        createdAt: populatedChatResponse.createdAt.toISOString(),
        updatedAt: populatedChatResponse.updatedAt.toISOString(),
      });

      expect(saveChatSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: ['user1', 'user2'],
          chatType: 'direct',
          messages: expect.arrayContaining([
            expect.objectContaining({
              msg: 'Hello!',
              msgFrom: 'user1',
              type: 'direct',
            }),
          ]),
        }),
      );
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatResponse._id.toString(), 'chat');
    });

    it('should return 400 if participants array is invalid', async () => {
      const invalidPayload = {
        participants: [],
        messages: [],
      };

      const response = await supertest(app).post('/api/chat/createChat').send(invalidPayload);
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].message).toBe('must NOT have fewer than 1 items');
    });

    it('should return 500 on service error', async () => {
      saveChatSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app)
        .post('/api/chat/createChat')
        .send({
          participants: ['user1'],
          messages: [],
        });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating a chat: Service error');
    });

    it('should return 500 on populateChat error', async () => {
      const validChatPayload = {
        participants: ['user1', 'user2'],
        messages: [{ msg: 'Hello!', msgFrom: 'user1', msgDateTime: new Date('2025-01-01') }],
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [new mongoose.Types.ObjectId()],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue({ error: 'Provided ID is undefined.' });

      const response = await supertest(app).post('/api/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating a chat: Provided ID is undefined.');
    });
  });

  describe('POST /chat/createGroupChat', () => {
    it('should create a new group chat successfully', async () => {
      const validGroupChatPayload = {
        participants: ['user1', 'user2', 'user3'],
        messages: [
          { msg: 'Welcome to the group!', msgFrom: 'user1', msgDateTime: new Date('2025-01-01') },
        ],
        chatName: 'Test Group',
        chatAdmin: 'user1',
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2', 'user3'],
        messages: [new mongoose.Types.ObjectId()],
        chatType: 'group',
        chatName: 'Test Group',
        chatAdmin: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChatResponse: PopulatedDatabaseChat = {
        _id: chatResponse._id,
        participants: ['user1', 'user2', 'user3'],
        messages: [
          {
            _id: chatResponse.messages[0],
            msg: 'Welcome to the group!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
              avatarUrl: '',
            },
            type: 'direct',
          },
        ],
        chatType: 'group',
        chatName: 'Test Group',
        chatAdmin: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChatResponse);

      const response = await supertest(app)
        .post('/api/chat/createGroupChat')
        .send(validGroupChatPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: populatedChatResponse._id.toString(),
        participants: populatedChatResponse.participants.map(p => p.toString()),
        chatType: 'group',
        chatName: 'Test Group',
        chatAdmin: 'user1',
      });

      expect(saveChatSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          chatType: 'group',
          chatName: 'Test Group',
          chatAdmin: 'user1',
        }),
      );
    });

    it('should return 400 if fewer than 2 participants', async () => {
      const invalidPayload = {
        participants: ['user1'],
        messages: [],
        chatName: 'Invalid Group',
        chatAdmin: 'user1',
      };

      const response = await supertest(app).post('/api/chat/createGroupChat').send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.text).toBe('Group chats require at least 2 participants');
    });

    it('should return 500 on service error', async () => {
      const validPayload = {
        participants: ['user1', 'user2'],
        messages: [],
        chatName: 'Test Group',
        chatAdmin: 'user1',
      };

      saveChatSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app).post('/api/chat/createGroupChat').send(validPayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating group chat: Service error');
    });

    it('should return 500 on populateDocument error', async () => {
      const validPayload = {
        participants: ['user1', 'user2'],
        messages: [],
        chatName: 'Test Group',
        chatAdmin: 'user1',
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [],
        chatType: 'group',
        chatName: 'Test Group',
        chatAdmin: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue({ error: 'Population error' });

      const response = await supertest(app).post('/api/chat/createGroupChat').send(validPayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error creating group chat: Population error');
    });
  });

  describe('POST /chat/:chatId/leaveChat', () => {
    it('should successfully remove participant from group chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'user2';

      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user3'],
        messages: [],
        chatType: 'group',
        chatName: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedChat: PopulatedDatabaseChat = {
        _id: updatedChat._id,
        participants: ['user1', 'user3'],
        messages: [],
        chatType: 'group',
        chatName: 'Test Group',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      removeParticipantSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue(populatedChat);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/leaveChat`)
        .send({ username });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: populatedChat._id.toString(),
        participants: ['user1', 'user3'],
      });

      expect(removeParticipantSpy).toHaveBeenCalledWith(chatId, username);
      expect(populateDocumentSpy).toHaveBeenCalledWith(updatedChat._id.toString(), 'chat');
    });

    it('should return 500 if removeParticipantFromChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'user2';

      removeParticipantSpy.mockResolvedValue({ error: 'Cannot remove participant' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/leaveChat`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error leaving chat: Cannot remove participant');
    });

    it('should return 500 if populateDocument fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const username = 'user2';

      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user3'],
        messages: [],
        chatType: 'group',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      removeParticipantSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Population failed' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/leaveChat`)
        .send({ username });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error leaving chat: Population failed');
    });

    it('should return 400 if username is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const response = await supertest(app).post(`/api/chat/${chatId}/leaveChat`).send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /chat/:chatId/addMessage', () => {
    it('should add a message to chat successfully', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload: Message = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
        type: 'direct',
      };

      const serializedPayload = {
        ...messagePayload,
        msgDateTime: messagePayload.msgDateTime.toISOString(),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        ...messagePayload,
        user: {
          _id: new mongoose.Types.ObjectId(),
          username: 'user1',
          avatarUrl: '',
        },
      };

      const chatResponse: DatabaseChat = {
        _id: chatId,
        participants: ['user1', 'user2'],
        messages: [messageResponse._id],
        chatType: 'direct',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      const populatedChatResponse: PopulatedDatabaseChat = {
        _id: chatId,
        participants: ['user1', 'user2'],
        messages: [messageResponse],
        chatType: 'direct',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      getChatSpy.mockResolvedValue(chatResponse);
      saveMessageSpy.mockResolvedValue(messageResponse);
      addMessageSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(populatedChatResponse);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id: populatedChatResponse._id.toString(),
        participants: populatedChatResponse.participants.map(participant => participant.toString()),
        messages: populatedChatResponse.messages.map(message => ({
          ...message,
          _id: message._id.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user?._id.toString(),
          },
        })),
        createdAt: populatedChatResponse.createdAt.toISOString(),
        updatedAt: populatedChatResponse.updatedAt.toISOString(),
      });

      expect(getChatSpy).toHaveBeenCalledWith(chatId.toString());
      expect(saveMessageSpy).toHaveBeenCalledWith(serializedPayload);
      expect(addMessageSpy).toHaveBeenCalledWith(chatId.toString(), messageResponse._id.toString());
      expect(populateDocumentSpy).toHaveBeenCalledWith(
        populatedChatResponse._id.toString(),
        'chat',
      );
    });

    it('should return 403 if sender is not a participant', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload: Message = {
        msg: 'Hello!',
        msgFrom: 'user3', // Not a participant
        msgDateTime: new Date('2025-01-01'),
        type: 'direct',
      };

      const chatResponse: DatabaseChat = {
        _id: chatId,
        participants: ['user1', 'user2'], // user3 not included
        messages: [],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chatResponse);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(403);
      expect(response.text).toBe('You are not a participant in this chat');
      expect(saveMessageSpy).not.toHaveBeenCalled();
      expect(addMessageSpy).not.toHaveBeenCalled();
    });

    it('should return 400 for missing chatId, msg, or msgFrom', async () => {
      const chatId = new mongoose.Types.ObjectId();

      // Test missing msg
      const missingMsg = {
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };
      const response1 = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(missingMsg);
      expect(response1.status).toBe(400);

      // Test missing msgFrom
      const missingFrom = {
        msg: 'Hello!',
        msgDateTime: new Date('2025-01-01'),
      };
      const response2 = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(missingFrom);
      expect(response2.status).toBe(400);
    });

    it('should return 500 if getChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messagePayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };

      getChatSpy.mockResolvedValue({ error: 'Chat not found' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding a message to chat: Chat not found');
    });

    it('should return 500 if addMessageToChat returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messagePayload = {
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date().toISOString(),
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chatResponse);
      saveMessageSpy.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
        type: 'direct' as 'direct' | 'global',
      });
      addMessageSpy.mockResolvedValue({ error: 'Error updating chat' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error updating chat');
    });

    it('should throw an error if message creation fails and does not return an _id', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messagePayload: Message = {
        msg: 'Hello',
        msgFrom: 'user1',
        msgDateTime: new Date(),
        type: 'direct',
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chatResponse);
      saveMessageSpy.mockResolvedValue({ error: 'Error saving message' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error adding a message to chat: Error saving message');
    });

    it('should return 500 if populateDocument returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messagePayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
        type: 'direct' as 'direct' | 'global',
      };

      getChatSpy.mockResolvedValue(chatResponse);
      saveMessageSpy.mockResolvedValue(messageResponse);
      addMessageSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue({ error: 'Error populating chat' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error populating chat');
    });

    it('should return 500 if createMessage returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messagePayload = { msg: 'Hello!', msgFrom: 'user1', msgDateTime: new Date() };

      const chatResponse: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(chatResponse);
      saveMessageSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addMessage`)
        .send(messagePayload);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding a message to chat: Service error');
    });
  });

  describe('GET /chat/:chatId', () => {
    it('should retrieve a chat by ID', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      const mockFoundChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [new mongoose.Types.ObjectId()],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPopulatedChat: PopulatedDatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [
          {
            _id: new mongoose.Types.ObjectId(),
            msg: 'Hello!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01T00:00:00Z'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
              avatarUrl: '',
            },
            type: 'direct',
          },
        ],
        chatType: 'direct',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(mockFoundChat);
      populateDocumentSpy.mockResolvedValue(mockPopulatedChat);

      const response = await supertest(app).get(`/api/chat/${chatId}`);

      expect(response.status).toBe(200);
      expect(getChatSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(mockFoundChat._id.toString(), 'chat');

      expect(response.body).toMatchObject({
        _id: mockPopulatedChat._id.toString(),
        participants: mockPopulatedChat.participants.map(p => p.toString()),
        messages: mockPopulatedChat.messages.map(m => ({
          _id: m._id.toString(),
          msg: m.msg,
          msgFrom: m.msgFrom,
          msgDateTime: m.msgDateTime.toISOString(),
          user: {
            _id: m.user?._id.toString(),
            username: m.user?.username,
          },
        })),
        createdAt: mockPopulatedChat.createdAt.toISOString(),
        updatedAt: mockPopulatedChat.updatedAt.toISOString(),
      });
    });

    it('should return 500 if getChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      getChatSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app).get(`/api/chat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error retrieving chat: Service error');
    });

    it('should return 500 if populateDocument returns an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const foundChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        chatType: 'direct' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(foundChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Error populating chat' });

      const response = await supertest(app).get(`/api/chat/${chatId}`);

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error populating chat');
      expect(getChatSpy).toHaveBeenCalledWith(chatId);
      expect(populateDocumentSpy).toHaveBeenCalledWith(foundChat._id.toString(), 'chat');
    });
  });

  describe('POST /chat/:chatId/addParticipant', () => {
    it('should add a participant to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [],
        chatType: 'group',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const populatedUpdatedChat: PopulatedDatabaseChat = {
        _id: updatedChat._id,
        participants: ['user1', 'user2'],
        messages: [],
        chatType: 'group',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addParticipantSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue(populatedUpdatedChat);

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ userId });

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        _id: populatedUpdatedChat._id.toString(),
        participants: populatedUpdatedChat.participants.map(id => id.toString()),
        messages: [],
        createdAt: populatedUpdatedChat.createdAt.toISOString(),
        updatedAt: populatedUpdatedChat.updatedAt.toISOString(),
      });

      expect(addParticipantSpy).toHaveBeenCalledWith(chatId, userId);
    });

    it('should return 400 if userId is missing', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const response = await supertest(app).post(`/api/chat/${chatId}/addParticipant`).send({});
      const openApiError = JSON.parse(response.text);

      expect(response.status).toBe(400);
      expect(openApiError.errors[0].path).toBe('/body/userId');
    });

    it('should return 500 if addParticipantToChat fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      addParticipantSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ userId });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding participant to chat: Service error');
    });

    it('should return 500 if populateDocument has an error', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      const updatedChat: DatabaseChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [],
        chatType: 'group',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addParticipantSpy.mockResolvedValue(updatedChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Provided ID is undefined.' });

      const response = await supertest(app)
        .post(`/api/chat/${chatId}/addParticipant`)
        .send({ userId });

      expect(response.status).toBe(500);
      expect(response.text).toBe('Error adding participant to chat: Provided ID is undefined.');
    });
  });

  describe('GET /chat/getChatsByUser/:userId', () => {
    it('should return 200 with an array of chats', async () => {
      const userId = 'user1';

      const chats: DatabaseChat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          chatType: 'direct',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const populatedChats: PopulatedDatabaseChat[] = [
        {
          _id: chats[0]._id,
          participants: ['user1', 'user2'],
          messages: [],
          chatType: 'direct',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      getChatsByParticipantsSpy.mockResolvedValueOnce(chats);
      populateDocumentSpy.mockResolvedValueOnce(populatedChats[0]);

      const response = await supertest(app).get(`/api/chat/getChatsByUser/${userId}`);

      expect(getChatsByParticipantsSpy).toHaveBeenCalledWith([userId]);
      expect(populateDocumentSpy).toHaveBeenCalledWith(populatedChats[0]._id.toString(), 'chat');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject([
        {
          _id: populatedChats[0]._id.toString(),
          participants: ['user1', 'user2'],
          messages: [],
          createdAt: populatedChats[0].createdAt.toISOString(),
          updatedAt: populatedChats[0].updatedAt.toISOString(),
        },
      ]);
    });

    it('should return 500 if populateDocument fails for any chat', async () => {
      const userId = 'user1';
      const chats: DatabaseChat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: ['user1', 'user2'],
          messages: [],
          chatType: 'direct',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      getChatsByParticipantsSpy.mockResolvedValueOnce(chats);
      populateDocumentSpy.mockResolvedValueOnce({ error: 'Service error' });

      const response = await supertest(app).get(`/api/chat/getChatsByUser/${userId}`);

      expect(getChatsByParticipantsSpy).toHaveBeenCalledWith([userId]);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chats[0]._id.toString(), 'chat');
      expect(response.status).toBe(500);
      expect(response.text).toBe('Error retrieving chats: Failed populating all retrieved chats');
    });
  });

  describe('Socket handlers', () => {
    let io: Server;
    let serverSocket: ServerSocket;
    let clientSocket: ClientSocket;

    beforeAll(done => {
      const httpServer = createServer();
      io = new Server(httpServer);
      chatController(io);

      httpServer.listen(() => {
        const { port } = httpServer.address() as AddressInfo;
        clientSocket = Client(`http://localhost:${port}`);
        io.on('connection', socket => {
          serverSocket = socket;
        });
        clientSocket.on('connect', done);
      });
    });

    afterAll(() => {
      clientSocket.disconnect();
      serverSocket.disconnect();
      io.close();
    });

    it('should join a chat room when "joinChat" event is emitted', done => {
      serverSocket.on('joinChat', arg => {
        expect(io.sockets.adapter.rooms.has('chat123')).toBeTruthy();
        expect(arg).toBe('chat123');
        done();
      });
      clientSocket.emit('joinChat', 'chat123');
    });

    it('should leave a chat room when "leaveChat" event is emitted', done => {
      serverSocket.on('joinChat', arg => {
        expect(io.sockets.adapter.rooms.has('chat123')).toBeTruthy();
        expect(arg).toBe('chat123');
      });
      serverSocket.on('leaveChat', arg => {
        expect(io.sockets.adapter.rooms.has('chat123')).toBeFalsy();
        expect(arg).toBe('chat123');
        done();
      });

      clientSocket.emit('joinChat', 'chat123');
      clientSocket.emit('leaveChat', 'chat123');
    });
  });
});
