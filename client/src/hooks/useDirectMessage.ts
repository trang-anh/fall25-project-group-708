import { ObjectId } from 'mongodb';
import { useEffect, useState } from 'react';
import {
  ChatUpdatePayload,
  Message,
  PopulatedDatabaseChat,
  SafeDatabaseUser,
} from '../types/types';
import useUserContext from './useUserContext';
import {
  createChat,
  createGroupChat,
  getChatById,
  getChatsByUser,
  leaveGroupChat,
  sendMessage,
} from '../services/chatService';
// import { useSearchParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useSearchParams } from 'react-router-dom';

/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging and group chats.
 * It includes a selected chat, messages, and functions for creating both direct and group chats.
 */
const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<'direct' | 'group'>('direct');
  const [chatToCreate, setChatToCreate] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupChatName, setGroupChatName] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<PopulatedDatabaseChat | null>(null);
  const [chats, setChats] = useState<PopulatedDatabaseChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // const [searchParams] = useSearchParams();
  // const targetUser = searchParams.get('user');

  const [searchParams] = useSearchParams();
  const targetUser = searchParams.get('user');
  const { showToast } = useToast();

  const handleJoinChat = (chatID: ObjectId) => {
    socket.emit('joinChat', String(chatID));
  };

  const handleSendMessage = async () => {
    if (!selectedChat) {
      setError('No chat selected');
      return;
    }

    // Verify the current user is still a participant in the chat
    if (!selectedChat.participants.includes(user.username)) {
      setError('You are no longer a participant in this chat');
      setSelectedChat(null);
      return;
    }

    if (newMessage.trim() && selectedChat?._id) {
      const message: Omit<Message, 'type'> = {
        msg: newMessage,
        msgFrom: user.username,
        msgDateTime: new Date(),
      };

      try {
        const chat = await sendMessage(message, selectedChat._id);

        setSelectedChat(chat);
        setError(null);
        setNewMessage('');
      } catch (err) {
        setError(`Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      setError('Message cannot be empty');
    }
  };

  const handleChatSelect = async (chatID: ObjectId | undefined) => {
    if (!chatID) {
      setError('Invalid chat ID');
      return;
    }

    const chat = await getChatById(chatID);
    setSelectedChat(chat);
    handleJoinChat(chatID);
  };

  const handleUserSelect = (selectedUser: SafeDatabaseUser) => {
    if (createMode === 'direct') {
      setChatToCreate(selectedUser.username);
    } else {
      // For group chat, toggle user selection
      setSelectedUsers(prev => {
        if (prev.includes(selectedUser.username)) {
          return prev.filter(u => u !== selectedUser.username);
        }
        return [...prev, selectedUser.username];
      });
    }
  };

  const handleCreateChat = async () => {
    if (createMode === 'direct') {
      if (!chatToCreate) {
        setError('Please select a user to chat with');
        return;
      }

      const chat = await createChat([user.username, chatToCreate]);
      setSelectedChat(chat);
      handleJoinChat(chat._id);
      setShowCreatePanel(false);
      setChatToCreate('');
      showToast('Chat created successfully!', 'success');
    } else {
      // Group chat creation
      if (selectedUsers.length < 1) {
        setError('Please select at least 1 other user for the group chat');
        return;
      }

      if (!groupChatName.trim()) {
        setError('Please enter a group chat name');
        return;
      }

      const participants = [user.username, ...selectedUsers];
      const chat = await createGroupChat(participants, groupChatName.trim(), user.username);
      setSelectedChat(chat);
      handleJoinChat(chat._id);
      setShowCreatePanel(false);
      setSelectedUsers([]);
      setGroupChatName('');
      setError(null);
      showToast(`Group chat "${groupChatName}" created successfully!`, 'success');
    }
  };

  const handleLeaveGroupChat = async () => {
    if (!selectedChat) {
      setError('No chat selected');
      return;
    }

    // Check if it's a group chat (using both chatType and participant count as fallback)
    const isGroupChat =
      selectedChat.chatType === 'group' || (selectedChat.participants?.length ?? 0) > 2;

    if (!isGroupChat) {
      setError('Can only leave group chats');
      return;
    }

    // Check if current user is the admin/creator
    const isAdmin = selectedChat.chatAdmin === user.username;

    if (isAdmin) {
      setError('Group admin cannot leave the chat');
      showToast('Group admin cannot leave the chat', 'error');
      return;
    }

    try {
      await leaveGroupChat(selectedChat._id, user.username);

      // Remove chat from list and clear selection
      setChats(prev => prev.filter(c => c._id !== selectedChat._id));
      setSelectedChat(null);
      setError(null);
      showToast('Left group chat successfully', 'success');
    } catch (err) {
      setError(
        `Failed to leave group chat: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  };

  const toggleCreateMode = () => {
    setCreateMode(prev => (prev === 'direct' ? 'group' : 'direct'));
    setChatToCreate('');
    setSelectedUsers([]);
    setGroupChatName('');
    setError(null);
  };

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getChatsByUser(user.username);
      setChats(userChats);
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      switch (type) {
        case 'created': {
          if (chat.participants.includes(user.username)) {
            setChats(prevChats => {
              const chatExists = prevChats.some(c => c._id === chat._id);
              if (chatExists) return prevChats;
              return [chat, ...prevChats];
            });
          }
          return;
        }
        case 'newMessage': {
          if (chat.participants.includes(user.username)) {
            if (selectedChat?._id === chat._id) {
              setSelectedChat(chat);
            }
            setChats(prevChats => {
              const existingIndex = prevChats.findIndex(c => c._id === chat._id);
              if (existingIndex >= 0) {
                const updated = [...prevChats];
                updated[existingIndex] = chat;
                return updated;
              }
              return prevChats;
            });
          }
          return;
        }
        case 'newParticipant': {
          if (chat.participants.includes(user.username)) {
            setChats(prevChats => {
              if (prevChats.some(c => chat._id === c._id)) {
                return prevChats.map(c => (c._id === chat._id ? chat : c));
              }
              return [chat, ...prevChats];
            });
          }
          return;
        }
        case 'removedParticipant': {
          if (!chat.participants.includes(user.username)) {
            // User was removed
            setChats(prevChats => {
              const wasParticipant = prevChats.some(
                c => c._id === chat._id && c.participants.includes(user.username),
              );
              if (wasParticipant) {
                if (selectedChat?._id === chat._id) {
                  setSelectedChat(null);
                }
                return prevChats.filter(c => c._id !== chat._id);
              }
              return prevChats;
            });
          } else {
            // Someone else left
            setChats(prevChats => prevChats.map(c => (c._id === chat._id ? chat : c)));
            if (selectedChat?._id === chat._id) {
              setSelectedChat(chat);
            }
          }
          return;
        }
        default: {
          setError('Invalid chat update type');
        }
      }
    };

    fetchChats();

    socket.on('chatUpdate', handleChatUpdate);

    return () => {
      socket.off('chatUpdate', handleChatUpdate);
      socket.emit('leaveChat', String(selectedChat?._id));
    };
  }, [user.username, socket, selectedChat?._id]);

  // Auto-open or create chat when ?user=username is present in the URL
  useEffect(() => {
    // Not navigating from matches → nothing to do
    if (!targetUser) return;

    // Wait for chats from the server to load
    if (chats.length === 0) return;

    // If a chat with this user already exists -> open it
    const existingChat = chats.find(chat => chat.participants.includes(targetUser));

    // If a chat exists and it's not already open
    if (existingChat && !selectedChat) {
      handleChatSelect(existingChat._id);
      return;
    }

    // If NO chat exists:
    if (!existingChat && !selectedChat) {
      // Set the user to create a chat with
      handleUserSelect({ username: targetUser } as SafeDatabaseUser);

      // Create chat
      handleCreateChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUser, chats, selectedChat]);

  return {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    createMode,
    toggleCreateMode,
    selectedUsers,
    groupChatName,
    setGroupChatName,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
    handleLeaveGroupChat,
    error,
    currentUsername: user.username,
  };
};

export default useDirectMessage;
