import { ObjectId } from 'mongodb';
import ChatModel from '../models/chat.model';
import UserModel from '../models/users.model';
import { Chat, ChatResponse, DatabaseChat, MessageResponse, DatabaseUser } from '../types/types';
import { saveMessage } from './message.service';

/**
 * Saves a new chat, storing any messages provided as part of the argument.
 * @param chatPayload - The chat object containing participant user IDs and full message data.
 * @returns {Promise<ChatResponse>} - The saved chat or an error message.
 */
export const saveChat = async (chatPayload: Chat): Promise<ChatResponse> => {
  try {
    // Save the messages provided in the argument to the database
    const messageIds: ObjectId[] = await Promise.all(
      chatPayload.messages.map(async msg => {
        const savedMessage: MessageResponse = await saveMessage(msg);

        if ('error' in savedMessage) {
          throw new Error(savedMessage.error);
        }

        return savedMessage._id;
      }),
    );

    // Normalize chatType to lowercase to match schema enum
    const normalizedChatType = chatPayload.chatType.toLowerCase() as 'direct' | 'group';

    // Create the chat using participant IDs and saved message IDs
    return await ChatModel.create({
      participants: chatPayload.participants,
      messages: messageIds,
      chatType: normalizedChatType,  // Use normalized lowercase value
      chatName: chatPayload.chatName,
      chatAdmin: chatPayload.chatAdmin,
    });
  } catch (error) {
    return { error: `Error saving chat: ${error}` };
  }
};

/**
 * Removes a participant from a group chat.
 * @param chatId - The ID of the group chat.
 * @param userId - The user ID of the participant to be removed.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 */
export const removeParticipantFromChat = async (
  chatId: string,
  userId: string,
): Promise<ChatResponse> => {
  try {
    console.log(`[removeParticipantFromChat] Removing ${userId} from chat ${chatId}`);
    
    const chat = await ChatModel.findById(chatId);

    if (!chat) {
      console.error(`[removeParticipantFromChat] Chat not found: ${chatId}`);
      throw new Error('Chat not found');
    }

    console.log(`[removeParticipantFromChat] Found chat. Type: ${chat.chatType}, Participants: ${chat.participants.length}`);

    // Don't allow removing from direct chats or if only 2 participants left
    if (chat.chatType === 'direct' || chat.participants.length <= 2) {
      console.error(`[removeParticipantFromChat] Cannot remove from direct chat or insufficient participants`);
      throw new Error('Cannot remove participant from this chat');
    }

    const updatedChat = await ChatModel.findByIdAndUpdate(
      chatId,
      { $pull: { participants: userId } },
      { new: true },
    );

    if (!updatedChat) {
      console.error(`[removeParticipantFromChat] Failed to remove participant`);
      throw new Error('Failed to remove participant');
    }

    console.log(`[removeParticipantFromChat] Successfully removed ${userId}. New participant count: ${updatedChat.participants.length}`);
    return updatedChat;
  } catch (error) {
    console.error(`[removeParticipantFromChat] Error:`, error);
    return { error: `Error removing participant: ${(error as Error).message}` };
  }
};

/**
 * Adds a message ID to a chat.
 * @param chatId - The ID of the chat to update.
 * @param messageId - The ID of the message to add.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 */
export const addMessageToChat = async (
  chatId: string,
  messageId: string,
): Promise<ChatResponse> => {
  try {
    const updatedChat: DatabaseChat | null = await ChatModel.findByIdAndUpdate(
      chatId,
      { $push: { messages: messageId } },
      { new: true },
    );

    if (!updatedChat) {
      throw new Error('Chat not found');
    }

    return updatedChat;
  } catch (error) {
    return { error: `Error adding message to chat: ${error}` };
  }
};

/**
 * Retrieves a chat document by its ID.
 * @param chatId - The ID of the chat to retrieve.
 * @returns {Promise<ChatResponse>} - The chat or an error message.
 */
export const getChat = async (chatId: string): Promise<ChatResponse> => {
  try {
    const chat: DatabaseChat | null = await ChatModel.findById(chatId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    return chat;
  } catch (error) {
    return { error: `Error retrieving chat: ${error}` };
  }
};

/**
 * Retrieves chats that include all the provided participants (by user ID).
 * @param participantIds - An array of participant user IDs.
 * @returns {Promise<DatabaseChat[]>} - An array of matching chats or an empty array.
 */
export const getChatsByParticipants = async (participantIds: string[]): Promise<DatabaseChat[]> => {
  try {
    const chats = await ChatModel.find({ participants: { $all: participantIds } }).lean();

    if (!chats) {
      throw new Error('Chat not found with the provided participants');
    }

    return chats;
  } catch {
    return [];
  }
};

/**
 * Adds a participant to an existing chat.
 * @param chatId - The ID of the chat to update.
 * @param userId - The user ID to add to the chat.
 * @returns {Promise<ChatResponse>} - The updated chat or an error message.
 */
export const addParticipantToChat = async (
  chatId: string,
  userId: string,
): Promise<ChatResponse> => {
  try {
    // Validate if user exists
    const userExists: DatabaseUser | null = await UserModel.findById(userId);

    if (!userExists) {
      throw new Error('User does not exist.');
    }

    // Add participant if not already in the chat
    const updatedChat: DatabaseChat | null = await ChatModel.findOneAndUpdate(
      { _id: chatId, participants: { $ne: userId } },
      { $push: { participants: userId } },
      { new: true },
    );

    if (!updatedChat) {
      throw new Error('Chat not found or user already a participant.');
    }

    return updatedChat;
  } catch (error) {
    return { error: `Error adding participant to chat: ${(error as Error).message}` };
  }
};