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

        {/* Bottom Navigation */}
        <div className='chats-list-nav'>
          <div className='nav-item'>
            <svg fill='currentColor' viewBox='0 0 24 24'>
              <path d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z'/>
            </svg>
            <span>Notifications</span>
          </div>
          <div className='nav-item'>
            <svg fill='currentColor' viewBox='0 0 24 24'>
              <path d='M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z'/>
            </svg>
            <span>Calls</span>
          </div>
          <div className='nav-item'>
            <svg fill='currentColor' viewBox='0 0 24 24'>
              <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'/>
            </svg>
            <span>Contacts</span>
          </div>
        </div>
      </div>

      <div className='chat-container'>
        {selectedChat && otherParticipant ? (
          <>
            <div className='chat-header-bar'>
              <div className='chat-header-content'>
                <div className='chat-header-left'>
                  <Avatar username={otherParticipant} avatarUrl={otherParticipantAvatar} size='medium' />
                  <h2>
                    <span className='status-dot'></span>
                    {otherParticipant}
                  </h2>
                </div>
                <div className='chat-header-icons'>
                  <button className='header-icon-btn' type='button'>
                    <svg fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z'/>
                    </svg>
                  </button>
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
              <div className='message-input-wrapper'>
                <button className='emoji-btn' type='button'>😊</button>
                <input
                  className='custom-input'
                  type='text'
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder='Type a message...'
                />
              </div>
              <div className='input-actions'>
                <button className='input-icon-btn' type='button'>
                  <svg fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z'/>
                  </svg>
                </button>
                <button className='input-icon-btn' type='button'>
                  <svg fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z'/>
                  </svg>
                </button>
                <button className='input-icon-btn' type='button'>
                  <svg fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'/>
                  </svg>
                </button>
              </div>
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