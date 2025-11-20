import './index.css';
import useMessagingPage from '../../../hooks/useMessagingPage';
import useUserContext from '../../../hooks/useUserContext';
import MessageCard from '../messageCard';

/**
 * Represents the MessagingPage component which displays the public chat room.
 * and provides functionality to send and receive messages.
 */
const MessagingPage = () => {
  const { messages, newMessage, setNewMessage, handleSendMessage, error } = useMessagingPage();
  const { user } = useUserContext();

  return (
    <div className='chat-room'>
      <div className='chat-header'>
        <h2>Chat Room</h2>
      </div>
      <div className='chat-messages'>
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

          // Check if this message is grouped with previous message
          const isGrouped = prevMessage?.msgFrom === message.msgFrom;

          // Check if this is the last message in a group
          const isLastInGroup = nextMessage?.msgFrom !== message.msgFrom;

          return (
            <MessageCard
              key={String(message._id)}
              message={message}
              currentUsername={user.username}
              isGrouped={isGrouped}
              isLastInGroup={isLastInGroup}
            />
          );
        })}
      </div>
      <div className='message-input'>
        <textarea
          className='message-textbox'
          placeholder='Type your message here'
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <div className='message-actions'>
          <button type='button' className='send-button' onClick={handleSendMessage}>
            Send
          </button>
          {error && <span className='error-message'>{error}</span>}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
