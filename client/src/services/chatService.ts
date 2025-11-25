import { ObjectId } from 'mongodb';
import { Message, PopulatedDatabaseChat } from '../types/types';
import api from './config';

const CHAT_API_URL = `/api/chat`;

/**
 * Fetches all chats associated with a given user.
 *
 * @param username - The username of the user whose chats are to be fetched.
 * @returns The list of chats for the specified user.
 * @throws Throws an error if the fetch fails or if the status code is not 200.
 */
export const getChatsByUser = async (username: string): Promise<PopulatedDatabaseChat[]> => {
  const res = await api.get(`${CHAT_API_URL}/getChatsByUser/${username}`);

  if (res.status !== 200) {
    throw new Error('Error when fetching chats for user');
  }

  return res.data;
};

/**
 * Fetches a chat by its unique ID.
 *
 * @param chatID - The ID of the chat to fetch.
 * @returns The details of the chat with the specified ID.
 * @throws Throws an error if the fetch fails or if the status code is not 200.
 */
export const getChatById = async (chatID: ObjectId): Promise<PopulatedDatabaseChat> => {
  const res = await api.get(`${CHAT_API_URL}/${chatID}`);

  if (res.status !== 200) {
    throw new Error('Error when fetching chat by ID');
  }

  return res.data;
};

/**
 * Sends a message to a specific chat.
 *
 * @param message - The message to be sent, excluding the 'type' property.
 * @param chatID - The ID of the chat to which the message will be added.
 * @returns The updated chat data after the message has been sent.
 * @throws Throws an error if the message could not be added to the chat.
 */
export const sendMessage = async (
  message: Omit<Message, 'type'>,
  chatID: ObjectId,
): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/${chatID}/addMessage`, message);

  if (res.status !== 200) {
    throw new Error('Error when adding message to chat');
  }

  return res.data;
};

/**
 * Creates a new chat with the specified participants.
 *
 * @param participants - An array of user IDs representing the participants of the chat.
 * @returns The newly created chat data.
 * @throws Throws an error if the chat creation fails or if the status code is not 200.
 */
export const createChat = async (participants: string[]): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/createChat`, { participants, messages: [] });

  if (res.status !== 200) {
    throw new Error('Error when adding message to chat');
  }

  return res.data;
};

/**
 * Create a new group chat with the specified participants and group name.
 *
 * @param participants - An array of user IDs representing the participants of the group chat.
 * @param groupName - The name of the group chat.
 * @returns The newly created group chat data.
 * @throws Throws an error if the group chat creation fails or if the status code is not 200.
 */
export const createGroupChat = async (
  participants: string[],
  chatName: string,
  chatAdmin: string,
): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/createGroupChat`, {
    participants,
    messages: [],
    chatName,
    chatAdmin,
  });

  if (res.status !== 200) {
    throw new Error('Error when creating group chat');
  }

  return res.data;
};

/**
 * Allows a user to leave a group chat.
 *
 * @param chatID - The ID of the group chat to leave.
 * @param username - The username of the user leaving the group chat.
 * @returns The updated group chat data after the user has left.
 * @throws Throws an error if the user could not leave the group chat.
 */
export const leaveGroupChat = async (
  chatID: ObjectId,
  username: string,
): Promise<PopulatedDatabaseChat> => {
  const res = await api.post(`${CHAT_API_URL}/${chatID}/leaveChat`, { username });

  if (res.status !== 200) {
    throw new Error('Error when leaving group chat');
  }

  return res.data;
};
