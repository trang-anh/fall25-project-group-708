import { MessageInChat } from '../../../types/types';
import Avatar from '../../avatar';
import './index.css';

interface MessageCardProps {
  message: MessageInChat;
  currentUsername?: string;
  isGrouped?: boolean;
  isLastInGroup?: boolean;
  isGroupChat?: boolean;
}

const MessageCard = ({
  message,
  currentUsername,
  isGrouped = false,
  isLastInGroup = false,
  isGroupChat = false,
}: MessageCardProps) => {
  const isOwnMessage = message.msgFrom === currentUsername;
  const showAvatar = !isGrouped;
  const showSenderName = isGroupChat && !isOwnMessage && !isGrouped;

  return (
    <div
      className={`message ${isOwnMessage ? 'sender' : 'receiver'} ${isGrouped ? 'grouped' : ''} ${isLastInGroup ? 'last-in-group' : ''}`}>
      {showAvatar ? (
        <Avatar username={message.msgFrom} avatarUrl={message.user?.avatarUrl} size='small' />
      ) : (
        <div className='message-avatar' /> // Placeholder for consistent spacing
      )}

      <div className='message-content-wrapper'>
        {showSenderName && <div className='message-header'>{message.msgFrom}</div>}

        <div className='message-body'>{message.msg}</div>

        {isLastInGroup && (
          <div className='message-time'>
            {new Date(message.msgDateTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;
