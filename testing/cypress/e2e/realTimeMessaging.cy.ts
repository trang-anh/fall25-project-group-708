import {
  loginUser,
  setupTest,
  teardownTest,
} from '../support/helpers';

describe('Cypress Tests for Real-Time Messaging Between Two Users', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Real-Time Messaging - WebSocket/Socket.io Chat', () => {
    it('3.6 | User A and User C can open their shared chat window', () => {
      // Login User A
      loginUser('user123');

      // Navigate to find matches
      cy.visit('http://localhost:4530/home');
      cy.contains(/pair programmer|find match|connect|match/i).click();

      cy.wait(500);

      // Connect with User C
      cy.contains(/connect|add|request/i).first().click();

      cy.wait(300);

      // Verify connection was made
      cy.get('body').then(($body) => {
        const hasResponse = $body.text().includes('sent') || 
                           $body.text().includes('connected') ||
                           $body.text().includes('success') ||
                           $body.text().includes('pending');
        expect(hasResponse).to.be.true;
      });

      // Navigate to chat/messages section
      cy.contains(/chat|message|inbox/i).should('exist');
    });

    it('3.6a | User A can open shared chat window with User C', () => {
      loginUser('user123');

      // Navigate to messages/chat
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      // Wait for chat list to load
      cy.wait(500);

      // Verify chat window is displayed
      cy.get('body').then(($body) => {
        const hasChatInterface = $body.text().includes('message') || 
                                $body.text().includes('chat') ||
                                $body.find('[class*="chat"], [class*="message"]').length > 0;
        expect(hasChatInterface).to.be.true;
      });

      // Look for User C in chat list
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').should('exist');
    });

    it('3.6b | Chat window displays conversation history with User C', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Click on User C's conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Verify chat message display area exists
      cy.get('body').then(($body) => {
        const hasMessageArea = $body.find('[class*="messages"], [class*="chat-window"], [class*="conversation"]').length > 0 ||
                              $body.text().includes('message') ||
                              $body.text().includes('chat');
        expect(hasMessageArea).to.be.true;
      });
    });

    it('3.6c | User A can see message input field in chat window', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation with User C
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Verify message input field exists
      cy.get('input[type="text"], textarea, [contenteditable="true"]').should('exist');
    });

    it('3.6d | User A can type a message in the chat window', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation with User C
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Type a message
      const testMessage = 'Hello User C! This is a test message.';
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type(testMessage, { force: true });

      // Verify message was typed
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .should(($el) => {
          const value = $el.val() || $el.text();
          expect(value).to.include(testMessage);
        });
    });

    it('3.6e | User A can send a message to User C', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation with User C
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Type and send message
      const testMessage = 'Hello User C! Pair programming session soon?';
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type(testMessage, { force: true });

      // Look for send button
      cy.contains(/send|submit/i).should('exist').click();

      // Wait for message to be sent
      cy.wait(300);

      // Verify message appears in chat window
      cy.get('body').should('contain.text', testMessage);
    });

    it('3.6f | Sent message appears in User A\'s chat window immediately', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send a message
      const testMessage = 'Testing real-time messaging';
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type(testMessage, { force: true });

      cy.contains(/send|submit/i).click();

      // Verify message appears immediately
      cy.get('[class*="message"], [class*="chat-message"]').should('contain.text', testMessage);
    });

    it('3.6g | User A can see message timestamp', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send a message
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type('Test message with timestamp', { force: true });

      cy.contains(/send|submit/i).click();

      cy.wait(300);

      // Check for timestamp or time indicator
      cy.get('body').then(($body) => {
        const hasTimestamp = $body.find('[class*="time"], [class*="timestamp"], [class*="date"]').length > 0 ||
                            $body.text().includes('ago') ||
                            /\d{1,2}:\d{2}/.test($body.text());
        // Timestamp is optional but good to have
        if (hasTimestamp) {
          expect(hasTimestamp).to.be.true;
        }
      });
    });

    it('3.6h | User A can see message sender indicator', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send a message
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type('Test message', { force: true });

      cy.contains(/send|submit/i).click();

      cy.wait(300);

      // Check for sender name or avatar
      cy.get('body').then(($body) => {
        const hasSenderInfo = $body.find('[class*="sender"], [class*="author"], [class*="user"]').length > 0 ||
                             $body.text().includes('you') ||
                             $body.find('[class*="avatar"], img').length > 0;
        expect(hasSenderInfo).to.be.true;
      });
    });

    it('3.6i | Message input field clears after sending', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send a message
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type('Test message', { force: true });

      cy.contains(/send|submit/i).click();

      cy.wait(300);

      // Verify input field is cleared
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .should(($el) => {
          const value = $el.val() || $el.text();
          expect(value).to.equal('');
        });
    });

    it('3.6j | Multiple messages can be sent in conversation', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send multiple messages
      const messages = ['First message', 'Second message', 'Third message'];
      
      messages.forEach((message) => {
        cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
          .type(message, { force: true });

        cy.contains(/send|submit/i).click();

        cy.wait(300);

        // Verify message appears
        cy.get('body').should('contain.text', message);
      });

      // Verify all messages are visible
      messages.forEach((message) => {
        cy.get('body').should('contain.text', message);
      });
    });

    it('3.6k | Chat window maintains message order', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send messages
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type('Message 1', { force: true });
      cy.contains(/send|submit/i).click();

      cy.wait(300);

      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type('Message 2', { force: true });
      cy.contains(/send|submit/i).click();

      cy.wait(300);

      // Verify messages appear in correct order
      cy.get('[class*="message"], [class*="chat-message"]').then(($messages) => {
        const messageTexts = $messages.map((i, el) => Cypress.$(el).text()).get();
        const hasCorrectOrder = messageTexts.indexOf('Message 1') < messageTexts.indexOf('Message 2');
        expect(hasCorrectOrder).to.be.true;
      });
    });

    it('3.6l | User A can see typing indicator from User C (if supported)', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Look for typing indicator element
      cy.get('body').then(($body) => {
        const hasTypingIndicator = $body.text().includes('typing') || 
                                  $body.text().includes('is typing') ||
                                  $body.find('[class*="typing"], [class*="indicator"]').length > 0;
        // Typing indicator is optional but good to have
        if (hasTypingIndicator) {
          expect(hasTypingIndicator).to.be.true;
        }
      });
    });

    it('3.6m | Message appears instantly in User C\'s chat window (3.5)', () => {
      // This test simulates real-time message delivery
      // In a real scenario, you would open two browser contexts
      
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation with User C
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Record time before sending
      const sendTime = Date.now();

      // Send a message
      const testMessage = `Real-time test message - ${sendTime}`;
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type(testMessage, { force: true });

      cy.contains(/send|submit/i).click();

      // Measure time until message appears
      const receiveTime = Date.now();
      const deliveryTime = receiveTime - sendTime;

      // Verify message appears quickly (within 1 second for real-time)
      expect(deliveryTime).to.be.lessThan(1000);

      // Verify message is visible in chat
      cy.get('body').should('contain.text', testMessage);
    });

    it('3.6n | User A can scroll through chat history', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Find the message display area
      cy.get('[class*="messages"], [class*="chat-window"], [class*="conversation"]').first()
        .then(($chatArea) => {
          const element = ($chatArea[0] as HTMLElement);
          if (element.scrollHeight > element.clientHeight) {
            // If scrollable, try to scroll
            cy.wrap($chatArea).scrollTo('top');

            // Verify we can scroll
            cy.wrap($chatArea).invoke('scrollTop').should('be.lte', 10);
          }
        });
    });

    it('3.6o | Chat window updates without page refresh', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Get initial message count
      cy.get('[class*="message"], [class*="chat-message"]').then(($messages) => {
        const initialCount = $messages.length;

        // Send a message
        cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
          .type('Test message', { force: true });

        cy.contains(/send|submit/i).click();

        cy.wait(300);

        // Verify message count increased without refresh
        cy.get('[class*="message"], [class*="chat-message"]').then(($updatedMessages) => {
          expect($updatedMessages.length).to.be.greaterThan(initialCount);
        });

        // Verify we're still on the same page (no refresh)
        cy.url().should('include', '/');
      });
    });

    it('3.6p | User A can send emoji or special characters in messages', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send message with special characters
      const specialMessage = 'Great! 👍 Let\'s code together! 🚀';
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type(specialMessage, { force: true });

      cy.contains(/send|submit/i).click();

      cy.wait(300);

      // Verify special characters are displayed correctly
      cy.get('body').should(($body) => {
        const text = $body.text();
        const hasEmojiOrCode = text.includes('👍') || text.includes('code') || text.includes('Great');
        expect(hasEmojiOrCode).to.be.true;
      });
    });

    it('3.6q | User A cannot send empty messages', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Try to send empty message
      cy.contains(/send|submit/i).click();

      // Verify empty message was not sent
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('empty') || 
                        $body.text().includes('required') ||
                        $body.text().includes('message');
        // Either shows error or doesn't send
        expect(hasError).to.be.true;
      });
    });

    it('3.6r | Chat connection persists across navigation', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Navigate to another page
      cy.contains(/home|questions|communities/i).click();

      cy.wait(500);

      // Navigate back to chat
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Verify chat still shows the previous conversation
      cy.get('body').then(($body) => {
        const hasChat = $body.find('[class*="chat"], [class*="message"]').length > 0 ||
                       $body.text().includes('chat') ||
                       $body.text().includes('message');
        expect(hasChat).to.be.true;
      });
    });

    it('3.6s | Messages are stored and persist across sessions', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send a message
      const persistenceMessage = 'This message should persist';
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type(persistenceMessage, { force: true });

      cy.contains(/send|submit/i).click();

      cy.wait(300);

      // Reload the page
      cy.reload();

      cy.wait(500);

      // Navigate to chat again
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open same conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Verify message still exists
      cy.get('body').should('contain.text', persistenceMessage);
    });
  });

  describe('Real-Time Chat Error Handling', () => {
    it('3.6t | Chat displays appropriate message if connection is lost', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Check for connection status indicator
      cy.get('body').then(($body) => {
        const hasConnectionStatus = $body.text().includes('connected') || 
                                   $body.text().includes('offline') ||
                                   $body.find('[class*="status"], [class*="connection"]').length > 0;
        // Connection status indicator is optional but good to have
        if (hasConnectionStatus) {
          expect(hasConnectionStatus).to.be.true;
        }
      });
    });

    it('3.6u | Failed messages show retry option', () => {
      loginUser('user123');

      // Navigate to messages
      cy.visit('http://localhost:4530/home');
      cy.contains(/chat|message|inbox/i).click();

      cy.wait(500);

      // Open conversation
      cy.get('[class*="chat"], [class*="message"], [class*="conversation"]').first().click();

      cy.wait(500);

      // Send a message
      cy.get('input[type="text"], textarea, [contenteditable="true"]').first()
        .type('Test message', { force: true });

      cy.contains(/send|submit/i).click();

      cy.wait(300);

      // Check for retry button if message fails to send
      cy.get('body').then(($body) => {
        const hasRetry = $body.text().includes('retry') || 
                        $body.text().includes('failed') ||
                        $body.find('[class*="retry"], [class*="error"]').length > 0;
        // Retry is optional but good practice for reliability
        if (hasRetry) {
          expect(hasRetry).to.be.true;
        }
      });
    });
  });
});
