import './index.css';
import { ObjectId } from 'mongodb';
import { PopulatedDatabaseChat } from '../../../../types/types';
import Avatar from '../../../avatar';

/**
 * ChatsListCard component displays information about a chat and allows the user to select it.
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
  // Filter out current user to show only the other participant
  const otherParticipant =
    chat.participants.find(p => p !== currentUsername) || chat.participants[0];

  // Get avatar from participantData first (most reliable)
  const otherParticipantData = chat.participantsData?.find(p => p.username === otherParticipant);
  let avatarUrl = otherParticipantData?.avatarUrl;

  // Fallback: search through messages if participantData is not available
  if (!avatarUrl) {
    for (const message of chat.messages) {
      if (message.msgFrom === otherParticipant && message.user?.avatarUrl) {
        avatarUrl = message.user.avatarUrl;
        break;
      }
    }
  }

  // Format the last update time
  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // Today - show time
      const hours = messageDate.getHours().toString().padStart(2, '0');
      const minutes = messageDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // This week - show day name
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[messageDate.getDay()];
    } else {
      // Older - show date
      const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
      const day = messageDate.getDate().toString().padStart(2, '0');
      return `${month}/${day}`;
    }
  };

  const timeDisplay = formatTime(chat.updatedAt);

  return (
    <div
      onClick={() => handleChatSelect(chat._id)}
      className={`chats-list-card ${isSelected ? 'selected' : ''}`}>
      <Avatar username={otherParticipant} avatarUrl={avatarUrl} size='small' />
      <div className='chat-info'>
        <div className='chat-main-info'>
          <p className='chat-name'>{otherParticipant}</p>
        </div>
        <span className='chat-time'>{timeDisplay}</span>
      </div>
    </div>
  );
};

export default ChatsListCard;
