import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import { MessageInChat } from '../../../types/types';
import { getMetaData } from '../../../tool';
import Avatar from '../../avatar';

/**
 * MessageCard component displays a single message with its sender and timestamp.
 *
 * @param message: The message object to display.
 * @param currentUsername: The current user's username to determine message direction.
 * @param isGrouped: Whether this message is part of a group from the same sender.
 * @param isLastInGroup: Whether this is the last message in a group.
 */
const MessageCard = ({ 
  message,
  currentUsername,
  isGrouped = false,
  isLastInGroup = false,
}: { 
  message: MessageInChat;
  currentUsername?: string;
  isGrouped?: boolean;
  isLastInGroup?: boolean;
}) => {
  // Determine if this is a sent or received message
  const isSender = currentUsername && message.msgFrom === currentUsername;
  const avatarUrl = message.user?.avatarUrl;
  
  // Format time
  const timeDisplay = getMetaData(new Date(message.msgDateTime));

  // Debug log (remove after testing)
  console.log('MessageCard:', {
    msgFrom: message.msgFrom,
    currentUsername,
    isSender,
    avatarUrl
  });

  return (
    <div className={`message ${isSender ? 'sender' : 'receiver'} ${isGrouped ? 'grouped' : ''} ${isLastInGroup ? 'last-in-group' : ''}`}>
      {!isSender && (
        <div className='message-avatar'>
          <Avatar 
            username={message.msgFrom} 
            avatarUrl={avatarUrl}
            size='small' 
          />
        </div>
      )}
      <div className='message-content-wrapper'>
        {!isGrouped && (
          <div className='message-header'>
            <span className='message-sender'>{message.msgFrom}</span>
            <span className='message-time'>{timeDisplay}</span>
          </div>
        )}
        <div className='message-body'>
          <Markdown remarkPlugins={[remarkGfm]}>{message.msg}</Markdown>
        </div>
      </div>
      {isSender && (
        <div className='message-avatar'>
          <Avatar 
            username={message.msgFrom} 
            avatarUrl={avatarUrl}
            size='small' 
          />
        </div>
      )}
    </div>
  );
};

export default MessageCard;