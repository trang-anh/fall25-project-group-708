import './index.css';
import { ObjectId } from 'mongodb';
import { PopulatedDatabaseChat } from '../../../../types/types';
import Avatar from '../../../avatar';

/**
 * ChatsListCard component displays information about a chat and allows the user to select it.
 * Supports both direct and group chats.
 *
 * @param chat: The chat object containing details like participants and chat ID.
 * @param handleChatSelect: A function to handle the selection of a chat, receiving the chat's ID as an argument.
 * @param currentUsername: The current user's username to filter participants.
 * @param isSelected: Whether this chat is currently selected.
 */
const ChatsListCard = ({
  chat,
  handleChatSelect,
  currentUsername,
  isSelected = false,
}: {
  chat: PopulatedDatabaseChat;
  handleChatSelect: (chatID: ObjectId | undefined) => void;
  currentUsername?: string;
  isSelected?: boolean;
}) => {
  // Detect group chat: check chatType first, then fallback to participant count
  const isGroupChat = chat.chatType === 'group' || (chat.participants?.length ?? 0) > 2;

  // For direct chats, get the other participant
  const otherParticipant = !isGroupChat
    ? chat.participants.find(p => p !== currentUsername) || chat.participants[0]
    : null;

  // Get avatar for direct chats
  let avatarUrl: string | undefined;
  if (!isGroupChat && otherParticipant) {
    const otherParticipantData = chat.participantsData?.find(p => p.username === otherParticipant);
    avatarUrl = otherParticipantData?.avatarUrl;

    // Fallback: search through messages
    if (!avatarUrl) {
      for (const message of chat.messages) {
        if (message.msgFrom === otherParticipant && message.user?.avatarUrl) {
          avatarUrl = message.user.avatarUrl;
          break;
        }
      }
    }
  }

  // Format the last update time
  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const hours = messageDate.getHours().toString().padStart(2, '0');
      const minutes = messageDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[messageDate.getDay()];
    } else {
      const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
      const day = messageDate.getDate().toString().padStart(2, '0');
      return `${month}/${day}`;
    }
  };

  const timeDisplay = formatTime(chat.updatedAt);

  // Display name for group or direct chats
  const displayName = isGroupChat
    ? chat.chatName && chat.chatName.trim() !== ''
      ? chat.chatName
      : `Group (${chat.participants.length} members)`
    : otherParticipant || 'Unknown';

  // Participant count for group chats
  const participantCount = isGroupChat ? chat.participants.length : null;

  return (
    <div
      onClick={() => handleChatSelect(chat._id)}
      className={`chats-list-card ${isSelected ? 'selected' : ''}`}
      title={displayName}>
      {isGroupChat ? (
        <div className='group-chat-avatar'>
          <svg viewBox='0 0 24 24' fill='currentColor'>
            <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
          </svg>
        </div>
      ) : (
        <Avatar username={otherParticipant || 'Unknown'} avatarUrl={avatarUrl} size='small' />
      )}
      <div className='chat-info'>
        <div className='chat-main-info'>
          <p className={`chat-name ${isGroupChat ? 'group-name' : ''}`}>{displayName}</p>
          {isGroupChat && participantCount && (
            <p className='chat-participants'>{participantCount} participants</p>
          )}
        </div>
        <span className='chat-time'>{timeDisplay}</span>
      </div>
    </div>
  );
};

export default ChatsListCard;
