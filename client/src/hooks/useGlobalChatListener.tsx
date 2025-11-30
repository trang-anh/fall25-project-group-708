import { useEffect } from 'react';
import { ChatUpdatePayload } from '../types/types';
import useUserContext from './useUserContext';
import { useToast } from '../contexts/ToastContext';

/**
 * Global hook that listens to chat updates regardless of which page the user is on
 * This ensures notifications appear even when not on the direct message page
 */
const useGlobalChatListener = () => {
  const { user, socket } = useUserContext();
  const { showToast } = useToast();

  useEffect(() => {
    if (!socket || !user?.username) return;

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      const { chat, type } = chatUpdate;

      switch (type) {
        case 'created': {
          if (chat.participants.includes(user.username)) {
            const chatName =
              chat.chatName && chat.chatName.trim() !== ''
                ? `"${chat.chatName}"`
                : chat.chatType === 'group'
                  ? 'a group chat'
                  : 'a chat';
            showToast(`You were added to ${chatName}`, 'info');
          }
          break;
        }
        case 'newParticipant': {
          if (chat.participants.includes(user.username)) {
            const chatName =
              chat.chatName && chat.chatName.trim() !== '' ? `"${chat.chatName}"` : 'a group chat';
            showToast(`You were added to ${chatName}`, 'info');
          }
          break;
        }
        case 'removedParticipant': {
          const chatName =
            chat.chatName && chat.chatName.trim() !== '' ? `"${chat.chatName}"` : 'the group chat';

          if (!chat.participants.includes(user.username)) {
            showToast(`You were removed from ${chatName}`, 'info');
          } else {
            showToast(`A member left ${chatName}`, 'info');
          }
          break;
        }
        case 'newMessage': {
          break;
        }
      }
    };

    socket.on('chatUpdate', handleChatUpdate);

    return () => {
      socket.off('chatUpdate', handleChatUpdate);
    };
  }, [socket, user, showToast]);
};

export default useGlobalChatListener;
