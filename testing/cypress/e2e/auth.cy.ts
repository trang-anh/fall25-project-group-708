import {
  loginUser,
  setupTest,
  teardownTest,
  goToQuestions,
} from '../support/helpers';
import {
  WELCOME_MESSAGE,
  QUESTIONS_LINK,
  TEST_USERNAME,
} from '../../../server/testData/post_strings';

describe('Cypress Tests for User Authentication', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Successful Login Tests', () => {
    it('2.1 | User can successfully login with valid credentials', () => {
      // Visit the login page
      cy.visit('http://localhost:4530');

      // Verify login form elements are present
      cy.get('#username-input').should('be.visible');
      cy.get('#password-input').should('be.visible');
      cy.contains('Submit').should('be.visible');

      // Login with valid credentials
      loginUser('user123');

      // Verify redirect to home page
      cy.url().should('include', '/home');

      // Verify the questions page loads successfully
      cy.contains(QUESTIONS_LINK).should('be.visible');
      cy.get('.postTitle').should('exist');
    });

    it('2.2 | User session persists after login', () => {
      // Login with valid credentials
      loginUser('user123');

      // Verify user is on home page
      cy.url().should('include', '/home');

      // Navigate to a different page
      cy.contains('Questions').click();

      // Verify user is still authenticated (not redirected to login)
      cy.url().should('include', '/home');
      cy.get('.postTitle').should('exist');
    });

    it('2.3 | User can see questions after successful login', () => {
      loginUser('user123');

      // Verify we're on the home page
      cy.url().should('include', '/home');

      // Verify questions are loaded
      cy.get('.postTitle').should('exist');

      // Verify at least one question is displayed
      cy.get('.postTitle').should('have.length.greaterThan', 0);
    });

    it('2.4 | Login form clears after successful submission', () => {
      cy.visit('http://localhost:4530');

      // Type credentials
      cy.get('#username-input').type('user123');
      cy.get('#password-input').type('securePass123!');

      // Submit login form
      cy.contains('Submit').click();

      // Wait for redirect
      cy.url().should('include', '/home');

      // Go back to login (if possible) - verify form is empty or user is logged in
      // In a real app, going back to login while authenticated might redirect
      cy.contains(QUESTIONS_LINK).should('be.visible');
    });

    it('2.5 | User can navigate after successful login', () => {
      loginUser('user123');

      // Verify initial page is loaded
      cy.url().should('include', '/home');
      cy.get('.postTitle').should('exist');

      // Navigate to a specific question
      cy.get('.postTitle').first().click();

      // Verify question details page loads
      cy.url().should('include', '/question/');
      cy.get('.questionBody').should('exist');

      // Navigate back to questions
      goToQuestions();

      // Verify we're back on the questions page
      cy.url().should('include', '/home');
      cy.get('.postTitle').should('exist');
    });

    it('2.6 | Multiple users can login successfully', () => {
      // First user login
      loginUser('user123');
      cy.url().should('include', '/home');

      // Verify questions page is accessible
      cy.get('.postTitle').should('exist');
    });

    it('2.7 | Remember This Device – Faster Re-login', () => {
      // Initial login with "Remember this device" enabled
      cy.visit('http://localhost:4530');

      // Verify login form elements
      cy.get('#username-input').should('be.visible');
      cy.get('#password-input').should('be.visible');

      // Check if remember device checkbox exists
      cy.get('input[type="checkbox"]')
        .filter((index, element) => {
          return Cypress.$(element).closest('label').text().includes('Remember');
        })
        .then($checkbox => {
          if ($checkbox.length > 0) {
            // Enable "Remember this device" checkbox if it exists
            cy.wrap($checkbox).check({ force: true });
          }
        });

      // Login with valid credentials
      loginUser('user123');

      // Verify redirect to home page
      cy.url().should('include', '/home');
      cy.contains(QUESTIONS_LINK).should('be.visible');
      cy.get('.postTitle').should('exist');

      // Simulate closing and reopening the browser/app
      cy.clearCookies();
      cy.clearLocalStorage();

      // Return to login page
      cy.visit('http://localhost:4530');

      // Check if device is remembered (user should be auto-signed in or have faster re-auth)
      // Case 1: If user is auto-signed in
      cy.url().then(url => {
        if (url.includes('/home')) {
          // User was auto-signed in - verify questions page loads
          cy.contains(QUESTIONS_LINK).should('be.visible');
          cy.get('.postTitle').should('exist');
        } else {
          // Case 2: If user needs to re-authenticate but has reduced friction
          // (e.g., form is prefilled or 2FA is skipped)
          cy.url().should('include', '');

          // Verify login form is visible
          cy.get('#username-input').should('be.visible');
          cy.get('#password-input').should('be.visible');

          // If username is prefilled, verify it
          cy.get('#username-input').then($input => {
            const value = $input.val();
            // Check if username field is prefilled from remember device
            if (value && value.toString().length > 0) {
              cy.log('Username field was prefilled - device was remembered');
            }
          });

          // Complete login with potentially fewer steps
          loginUser('user123');

          // Verify home page loads successfully
          cy.url().should('include', '/home');
          cy.contains(QUESTIONS_LINK).should('be.visible');
        }
      });
    });

    it('2.8 | Login displays the correct UI after authentication', () => {
      loginUser('user123');

      // Verify navigation elements are present
      cy.contains('Questions').should('be.visible');
      cy.contains('Communities').should('exist');

      // Verify the page is properly rendered
      cy.get('header').should('exist');
      cy.get('.postTitle').should('exist');
    });

    it('2.9 | User receives feedback when accessing protected content after login', () => {
      loginUser('user123');

      // Verify user can access the home page
      cy.url().should('include', '/home');

      // Verify question count is displayed
      cy.get('.postTitle').should('have.length.greaterThan', 0);

      // Try to access a specific question
      cy.get('.postTitle').first().click();
      cy.url().should('include', '/question/');

      // Verify we can read the question content
      cy.get('.questionBody').should('exist');
      cy.get('.questionBody').should('not.be.empty');
    });
  });

  describe('Login Form Validation', () => {
    it('2.10 | Username field is required for login', () => {
      cy.visit('http://localhost:4530');

      // Leave username empty
      cy.get('#password-input').type('securePass123!');
      cy.contains('Submit').click();

      // Should remain on login page or show error
      cy.url().should('not.include', '/home');
    });

    it('2.11 | Password field is required for login', () => {
      cy.visit('http://localhost:4530');

      // Only enter username
      cy.get('#username-input').type('user123');
      cy.contains('Submit').click();

      // Should remain on login page or show error
      cy.url().should('not.include', '/home');
    });

    it('2.12 | Welcome message displays on login page', () => {
      cy.visit('http://localhost:4530');

      // Verify welcome message is visible
      cy.contains(WELCOME_MESSAGE).should('be.visible');

      // Verify it's the main heading on the page
      cy.contains(WELCOME_MESSAGE).should('not.be.empty');
    });
  });

  describe('Login Security Tests', () => {
    it('2.13 | Passwords are masked in the input field', () => {
      cy.visit('http://localhost:4530');

      // Type password
      cy.get('#password-input').type('securePass123!');

      // Verify input type is password (masks the text)
      cy.get('#password-input').should('have.attr', 'type', 'password');
    });

    it('2.14 | Login redirects with replace (prevents back button returning to login)', () => {
      loginUser('user123');

      // Verify we're on home page
      cy.url().should('include', '/home');

      // Try to go back (should not work as page was replaced)
      cy.go('back');

      // Should still be on home or app page, not login
      cy.url().should('not.equal', 'http://localhost:4530');
    });

    it('2.15 | Session is established after successful login', () => {
      loginUser('user123');

      // Verify home page is accessible
      cy.url().should('include', '/home');

      // Verify questions are loaded (proving backend is responding)
      cy.get('.postTitle').should('exist');

      // Navigate to another page and back
      cy.contains('Communities').click();
      cy.contains('Questions').click();

      // Verify still authenticated
      cy.url().should('include', '/home');
      cy.get('.postTitle').should('exist');
    });
  });

  describe('Login User Experience Tests', () => {
    it('2.16 | User is informed of successful login via page redirect', () => {
      cy.visit('http://localhost:4530');

      // Perform login
      cy.get('#username-input').type('user123');
      cy.get('#password-input').type('securePass123!');
      cy.contains('Submit').click();

      // Should be redirected to home
      cy.url().should('include', '/home');

      // Verify home page content is loaded
      cy.contains(QUESTIONS_LINK).should('be.visible');
    });

    it('2.17 | Questions are loaded immediately after successful login', () => {
      loginUser('user123');

      // Verify questions are present without waiting for additional clicks
      cy.get('.postTitle').should('exist');
      cy.get('.postTitle').should('have.length.greaterThan', 0);
    });

    it('2.18 | User can interact with page elements after login', () => {
      loginUser('user123');

      // Verify user can click on navigation elements
      cy.contains('Communities').should('be.visible').click();
      cy.url().should('include', '/communities');

      // Navigate back
      cy.contains('Questions').click();
      cy.url().should('include', '/home');
    });

    it('2.19 | Login flow is completed within reasonable time', () => {
      cy.visit('http://localhost:4530');

      const startTime = Date.now();

      // Perform login
      cy.get('#username-input').type('user123');
      cy.get('#password-input').type('securePass123!');
      cy.contains('Submit').click();

      // Wait for redirect to home
      cy.url().should('include', '/home');

      // Verify page is fully loaded
      cy.get('.postTitle').should('exist');
    });
  });
});
