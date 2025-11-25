import './index.css';
import useDirectMessage from '../../../hooks/useDirectMessage';
import ChatsListCard from './chatsListCard';
import UsersListPage from '../usersListPage';
import MessageCard from '../messageCard';
import Avatar from '../../avatar';

/**
 * DirectMessage component renders a page for direct messaging and group chats.
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
    currentUsername,
  } = useDirectMessage();

  const isGroupChat =
    selectedChat?.chatType === 'group' || (selectedChat?.participants?.length ?? 0) > 2;

  // Get the other participant's name for direct chats
  const otherParticipant = !isGroupChat
    ? selectedChat?.participants.find(p => p !== currentUsername) || selectedChat?.participants[0]
    : null;

  // Get avatar for direct chats
  let otherParticipantAvatar: string | undefined;
  if (!isGroupChat && selectedChat && otherParticipant) {
    const otherParticipantData = selectedChat.participantsData?.find(
      p => p.username === otherParticipant,
    );
    otherParticipantAvatar = otherParticipantData?.avatarUrl;

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
              <path d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z' />
            </svg>
            <input type='text' placeholder='Persons, Groups, Chats' />
            <button className='start-chat-btn' onClick={() => setShowCreatePanel(!showCreatePanel)}>
              +
            </button>
          </div>
        </div>

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

      {/* Create Chat Panel */}
      {showCreatePanel && (
        <div className='create-chat-panel'>
          <div className='create-chat-header'>
            <h3>New {createMode === 'direct' ? 'Chat' : 'Group Chat'}</h3>
            <button className='close-panel-btn' onClick={() => setShowCreatePanel(false)}>
              ×
            </button>
          </div>

          {/* Mode Toggle */}
          <div className='mode-toggle'>
            <button
              className={`mode-btn ${createMode === 'direct' ? 'active' : ''}`}
              onClick={() => createMode !== 'direct' && toggleCreateMode()}>
              Direct
            </button>
            <button
              className={`mode-btn ${createMode === 'group' ? 'active' : ''}`}
              onClick={() => createMode !== 'group' && toggleCreateMode()}>
              Group
            </button>
          </div>

          {error && <div className='panel-error'>{error}</div>}

          {createMode === 'direct' ? (
            <>
              <p className='panel-label'>Selected user: {chatToCreate || 'None'}</p>
              <button className='panel-button' onClick={handleCreateChat} disabled={!chatToCreate}>
                Create Chat
              </button>
            </>
          ) : (
            <>
              <div className='group-name-input'>
                <input
                  type='text'
                  placeholder='Group name'
                  value={groupChatName}
                  onChange={e => setGroupChatName(e.target.value)}
                  className='custom-input'
                />
              </div>
              <p className='panel-label'>
                Selected users: {selectedUsers.length > 0 ? selectedUsers.join(', ') : 'None'}
              </p>
              <button
                className='panel-button'
                onClick={handleCreateChat}
                disabled={selectedUsers.length < 1 || !groupChatName.trim()}>
                Create Group
              </button>
            </>
          )}

          <div className='users-list-container'>
            <UsersListPage
              handleUserSelect={handleUserSelect}
              selectedUsers={selectedUsers}
              currentUsername={currentUsername}
            />
          </div>
        </div>
      )}

      <div className='chat-container'>
        {selectedChat ? (
          <>
            <div className='chat-header-bar'>
              <div className='chat-header-content'>
                <div className='chat-header-left'>
                  {isGroupChat ? (
                    <div className='group-chat-header-avatar'>
                      <svg viewBox='0 0 24 24' fill='currentColor'>
                        <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
                      </svg>
                    </div>
                  ) : (
                    <Avatar
                      username={otherParticipant || 'Unknown'}
                      avatarUrl={otherParticipantAvatar}
                      size='small'
                    />
                  )}
                  <div className='chat-header-info'>
                    <h2>
                      {!isGroupChat && <span className='status-dot'></span>}
                      {isGroupChat
                        ? selectedChat.chatName && selectedChat.chatName.trim() !== ''
                          ? selectedChat.chatName
                          : `Group (${selectedChat.participants.length} members)`
                        : otherParticipant}
                    </h2>
                    {isGroupChat && (
                      <p className='group-participants-count'>
                        {selectedChat.participants.length} participants
                      </p>
                    )}
                  </div>
                </div>
                {isGroupChat && (
                  <button
                    className='leave-group-btn'
                    onClick={handleLeaveGroupChat}
                    title='Leave this group chat'
                    aria-label='Leave group chat'>
                    <span>✕</span>
                    Leave Group
                  </button>
                )}
              </div>
            </div>
            <div className='chat-messages'>
              {selectedChat.messages.map((message, index) => {
                const prevMessage = index > 0 ? selectedChat.messages[index - 1] : null;
                const nextMessage =
                  index < selectedChat.messages.length - 1
                    ? selectedChat.messages[index + 1]
                    : null;

                // Messages are grouped if they come from the same sender consecutively
                const isGrouped = prevMessage?.msgFrom === message.msgFrom;
                const isLastInGroup = nextMessage?.msgFrom !== message.msgFrom;

                return (
                  <MessageCard
                    key={String(message._id)}
                    message={message}
                    currentUsername={currentUsername}
                    isGrouped={isGrouped}
                    isLastInGroup={isLastInGroup}
                    isGroupChat={isGroupChat}
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
                placeholder={
                  selectedChat.participants.includes(currentUsername)
                    ? 'Type a message...'
                    : 'You are not a participant in this chat'
                }
                disabled={!selectedChat.participants.includes(currentUsername)}
              />
            </div>
          </>
        ) : (
          <h2>Select a chat to start messaging</h2>
        )}
      </div>
    </div>
  );
};

export default DirectMessage;
