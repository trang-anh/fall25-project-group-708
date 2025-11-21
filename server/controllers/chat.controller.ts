import express, { Response } from 'express';
import {
  saveChat,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
  removeParticipantFromChat,
} from '../services/chat.service';
import { populateDocument } from '../utils/database.util';
import {
  FakeSOSocket,
  CreateChatRequest,
  AddMessageRequestToChat,
  AddParticipantRequest,
  ChatIdRequest,
  GetChatByParticipantsRequest,
  LeaveGroupChatRequest,
  PopulatedDatabaseChat,
  CreateGroupChatRequest,
} from '../types/types';
import { saveMessage } from '../services/message.service';

/**
 * This controller handles chat-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the chat routes.
 * @throws {Error} Throws an error if the chat creation fails.
 */
const chatController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Creates a new direct chat with the given participants (and optional initial messages).
   * @param req The request object containing the chat data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is created.
   * @throws {Error} Throws an error if the chat creation fails.
   */
  const createChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    const { participants, messages } = req.body;
    const formattedMessages = messages.map(m => ({ ...m, type: 'direct' as 'direct' | 'global' }));

    try {
      const savedChat = await saveChat({
        participants,
        messages: formattedMessages,
        chatType: 'direct',
      });

      if ('error' in savedChat) {
        throw new Error(savedChat.error);
      }

      const populatedChat = await populateDocument(savedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', { chat: populatedChat as PopulatedDatabaseChat, type: 'created' });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error creating a chat: ${(err as Error).message}`);
    }
  };

  /**
   * Creates a group chat with the given participants.
   * @param req The request object containing the chat data (participants, chatName, chatAdmin).
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the group chat is created.
   * @throws {Error} Throws an error if the group chat creation fails.
   */
  const createGroupChatRoute = async (
    req: CreateGroupChatRequest,
    res: Response,
  ): Promise<void> => {
    const { participants, messages, chatName, chatAdmin } = req.body;

    // Validate minimum participants for group chat
    if (participants.length < 2) {
      res.status(400).send('Group chats require at least 2 participants');
      return;
    }

    const formattedMessages = messages.map(m => ({
      ...m,
      type: 'direct' as 'direct' | 'global',
    }));

    try {
      const savedChat = await saveChat({
        participants,
        messages: formattedMessages,
        chatType: 'group',
        chatName,
        chatAdmin,
      });

      if ('error' in savedChat) {
        throw new Error(savedChat.error);
      }

      const populatedChat = await populateDocument(savedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', {
        chat: populatedChat as PopulatedDatabaseChat,
        type: 'created',
      });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error creating group chat: ${(err as Error).message}`);
    }
  };

  /**
   * Allows a user to leave a group chat.
   * @param req The request object containing the chat ID and username.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the user is removed.
   * @throws {Error} Throws an error if leaving the chat fails.
   */
  const leaveGroupChatRoute = async (req: LeaveGroupChatRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;
    const { username } = req.body;

    console.log(`[leaveGroupChat] Attempting to remove user ${username} from chat ${chatId}`);

    try {
      const updatedChat = await removeParticipantFromChat(chatId, username);

      if ('error' in updatedChat) {
        console.error(`[leaveGroupChat] Error removing participant:`, updatedChat.error);
        throw new Error(updatedChat.error);
      }

      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        console.error(`[leaveGroupChat] Error populating chat:`, populatedChat.error);
        throw new Error(populatedChat.error);
      }

      console.log(`[leaveGroupChat] Successfully removed user ${username} from chat ${chatId}`);

      socket.emit('chatUpdate', {
        chat: populatedChat as PopulatedDatabaseChat,
        type: 'removedParticipant',
      });

      res.json(populatedChat);
    } catch (err: unknown) {
      console.error(`[leaveGroupChat] Exception:`, err);
      res.status(500).send(`Error leaving chat: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a new message to an existing chat.
   * @param req The request object containing the chat ID and message data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is added.
   * @throws {Error} Throws an error if the message addition fails.
   */
  const addMessageToChatRoute = async (
    req: AddMessageRequestToChat,
    res: Response,
  ): Promise<void> => {
    const { chatId } = req.params;
    const { msg, msgFrom, msgDateTime } = req.body;

    console.log(`[addMessageToChat] User ${msgFrom} sending message to chat ${chatId}`);

    try {
      // First, get the chat to verify the sender is a participant
      const chat = await getChat(chatId);
      
      if ('error' in chat) {
        console.error(`[addMessageToChat] Chat not found: ${chatId}`);
        throw new Error('Chat not found');
      }

      if (!chat.participants.includes(msgFrom)) {
        console.error(`[addMessageToChat] User ${msgFrom} is not a participant in chat ${chatId}`);
        res.status(403).send('You are not a participant in this chat');
        return;
      }

      const newMessage = await saveMessage({ msg, msgFrom, msgDateTime, type: 'direct' });

      if ('error' in newMessage) {
        throw new Error(newMessage.error);
      }

      const updatedChat = await addMessageToChat(chatId, newMessage._id.toString());

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }

      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      console.log(`[addMessageToChat] Message added successfully`);

      socket
        .to(chatId)
        .emit('chatUpdate', { chat: populatedChat as PopulatedDatabaseChat, type: 'newMessage' });
      res.json(populatedChat);
    } catch (err: unknown) {
      console.error(`[addMessageToChat] Error:`, err);
      res.status(500).send(`Error adding a message to chat: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves a chat by its ID, with populated participants and messages.
   * @param req The request object containing the chat ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is retrieved.
   * @throws {Error} Throws an error if the chat retrieval fails.
   */
  const getChatRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;

    try {
      const foundChat = await getChat(chatId);

      if ('error' in foundChat) {
        throw new Error(foundChat.error);
      }

      const populatedChat = await populateDocument(foundChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving chat: ${(err as Error).message}`);
    }
  };

  /**
   * Retrieves all chats for a user based on their user ID.
   * @param req The request object containing the userId parameter in `req.params`.
   * @param res The response object to send the result, either the populated chats or an error message.
   * @returns {Promise<void>} A promise that resolves when the chats are successfully retrieved and populated.
   */
  const getChatsByUserRoute = async (
    req: GetChatByParticipantsRequest,
    res: Response,
  ): Promise<void> => {
    const { userId } = req.params;

    try {
      const chats = await getChatsByParticipants([userId]);

      const populatedChats = await Promise.all(
        chats.map(chat => populateDocument(chat._id.toString(), 'chat')),
      );

      if (populatedChats.some(chat => 'error' in chat)) {
        throw new Error('Failed populating all retrieved chats');
      }

      res.json(populatedChats);
    } catch (err: unknown) {
      res.status(500).send(`Error retrieving chats: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a participant to an existing chat.
   * @param req The request object containing the chat ID and userId to add.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is added.
   * @throws {Error} Throws an error if the participant addition fails.
   */
  const addParticipantToChatRoute = async (
    req: AddParticipantRequest,
    res: Response,
  ): Promise<void> => {
    const { chatId } = req.params;
    const { userId } = req.body;

    try {
      const updatedChat = await addParticipantToChat(chatId, userId);

      if ('error' in updatedChat) {
        throw new Error(updatedChat.error);
      }

      const populatedChat = await populateDocument(updatedChat._id.toString(), 'chat');

      if ('error' in populatedChat) {
        throw new Error(populatedChat.error);
      }

      socket.emit('chatUpdate', {
        chat: populatedChat as PopulatedDatabaseChat,
        type: 'newParticipant',
      });
      res.json(populatedChat);
    } catch (err: unknown) {
      res.status(500).send(`Error adding participant to chat: ${(err as Error).message}`);
    }
  };

  // Socket.IO event handlers
  socket.on('connection', conn => {
    conn.on('joinChat', (chatID: string) => {
      conn.join(chatID);
    });

    conn.on('leaveChat', (chatID: string | undefined) => {
      if (chatID) {
        conn.leave(chatID);
      }
    });
  });

  // ===================================================================
  // Route Registration
  // IMPORTANT: Specific routes MUST come before parameterized routes
  // ===================================================================
  
  // Specific routes without dynamic parameters
  router.post('/createChat', createChatRoute);
  router.post('/createGroupChat', createGroupChatRoute);
  router.get('/getChatsByUser/:userId', getChatsByUserRoute);
  
  // Parameterized routes with :chatId
  router.get('/:chatId', getChatRoute);
  router.post('/:chatId/addMessage', addMessageToChatRoute);
  router.post('/:chatId/addParticipant', addParticipantToChatRoute);
  router.post('/:chatId/leaveChat', leaveGroupChatRoute);

  return router;
};

export default chatController;