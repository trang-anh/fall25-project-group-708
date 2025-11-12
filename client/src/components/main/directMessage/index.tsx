import './index.css';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import UsersListPage from '../usersListPage';
import MessageCard from '../messageCard';
import Avatar from '../../avatar';

/**
 * DirectMessage component renders a page for direct messaging between users.
 * It includes a list of users and a chat window to send and receive messages.
 */
const DirectMessage = () => {
  const {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
    error,
    currentUsername,
  } = useDirectMessage();

  // Get the other participant's name for the selected chat
  const otherParticipant = selectedChat?.participants.find(p => p !== currentUsername) || selectedChat?.participants[0];
  
  // Get avatar from participantData first (most reliable)
  let otherParticipantAvatar: string | undefined;
  
  if (selectedChat && otherParticipant) {
    // Try participantData first
    const otherParticipantData = selectedChat.participantsData?.find(
      p => p.username === otherParticipant
    );
    otherParticipantAvatar = otherParticipantData?.avatarUrl;
    
    // Fallback: search through messages if participantData is not available
    if (!otherParticipantAvatar) {
      for (const message of selectedChat.messages) {
        if (message.msgFrom === otherParticipant && message.user?.avatarUrl) {
          otherParticipantAvatar = message.user.avatarUrl;
          break;
        }
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className='direct-message-container'>
      <div className='chats-list'>
        {/* Search Header */}
        <div className='chats-list-header'>
          <div className='chats-list-search'>
            <svg className='search-icon' fill='currentColor' viewBox='0 0 16 16'>
              <path d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/>
            </svg>
            <input type='text' placeholder='Persons, Groups, Chats' />
            <button className='start-chat-btn' onClick={() => setShowCreatePanel(!showCreatePanel)}>
              +
            </button>
          </div>
        </div>

        {/* Create Chat Panel */}
        {showCreatePanel && (
          <div className='create-chat-panel'>
            {error && <div className='panel-error'>{error}</div>}
            <p className='panel-label'>Selected user: {chatToCreate || 'None'}</p>
            <button className='panel-button' onClick={handleCreateChat} disabled={!chatToCreate}>
              Create Chat
            </button>
            <UsersListPage handleUserSelect={handleUserSelect} />
          </div>
        )}

        {/* Chat List Items */}
        <div className='chats-list-items'>
          {chats.map(chat => (
            <ChatsListCard 
              key={String(chat._id)} 
              chat={chat} 
              handleChatSelect={handleChatSelect}
              currentUsername={currentUsername}
              isSelected={selectedChat?._id === chat._id}
            />
          ))}
        </div>
      </div>

      <div className='chat-container'>
        {selectedChat && otherParticipant ? (
          <>
            <div className='chat-header-bar'>
              <div className='chat-header-content'>
                <div className='chat-header-left'>
                  <Avatar username={otherParticipant} avatarUrl={otherParticipantAvatar} size='small' />
                  <h2>
                    <span className='status-dot'></span>
                    {otherParticipant}
                  </h2>
                </div>
              </div>
            </div>
              <div className='chat-messages'>
                {selectedChat.messages.map((message, index) => {
                  const prevMessage = index > 0 ? selectedChat.messages[index - 1] : null;
                  const nextMessage = index < selectedChat.messages.length - 1 ? selectedChat.messages[index + 1] : null;
                  
                  // Check if this message is grouped with previous message
                  const isGrouped = prevMessage?.msgFrom === message.msgFrom;
                  
                  // Check if this is the last message in a group
                  const isLastInGroup = nextMessage?.msgFrom !== message.msgFrom;
                  
                  // Debug log
                  console.log('DirectMessage rendering message:', {
                    msgFrom: message.msgFrom,
                    currentUsername: currentUsername,
                    index
                  });
                  
                  return (
                    <MessageCard 
                      key={String(message._id)} 
                      message={message}
                      currentUsername={currentUsername}
                      isGrouped={isGrouped}
                      isLastInGroup={isLastInGroup}
                    />
                  );
                })}
              </div>
            <div className='message-input'>
              <input
                className='custom-input'
                type='text'
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Type a message...'
              />
            </div>
          </>
        ) : (
          <h2>Select a user to start chatting</h2>
        )}
      </div>
    </div>
  );
};

export default DirectMessage;