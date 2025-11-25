import { loginUser, setupTest, teardownTest } from '../support/helpers';
import { WELCOME_MESSAGE } from '../../../server/testData/post_strings';

describe('Cypress Tests for Authentication Check', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('3.1 | User can successfully login and access the home page', () => {
    loginUser('user123');

    // Verify redirect to home page
    cy.url().should('include', '/home');

    // Verify the questions page is displayed
    cy.get('.postTitle').should('exist');
  });

  it('3.2 | Login page displays welcome message before authentication', () => {
    cy.visit('http://localhost:4530');

    // Verify welcome message is displayed
    cy.contains(WELCOME_MESSAGE).should('be.visible');

    // Verify login form is present
    cy.get('#username-input').should('exist');
    cy.get('#password-input').should('exist');
  });

  it('3.3 | Unauthenticated user sees login page', () => {
    cy.visit('http://localhost:4530');

    // Verify we're on the login page by checking for login form
    cy.get('#username-input').should('be.visible');
    cy.get('#password-input').should('be.visible');
    cy.contains('Submit').should('be.visible');

    // Verify URL is login page
    cy.url().should('not.include', '/home');
  });

  it('3.4 | Authenticated user can access protected pages', () => {
    loginUser('user123');

    // Verify home page is accessible
    cy.url().should('include', '/home');

    // Verify content is loaded
    cy.get('.postTitle').should('have.length.greaterThan', 0);

    // Verify user can navigate to another protected page
    cy.get('.postTitle').first().click();
    cy.url().should('include', '/question/');
  });

  it('3.5 | Session remains valid after navigation', () => {
    loginUser('user123');

    // Start on home page
    cy.url().should('include', '/home');

    // Navigate to communities
    cy.contains('Communities').click();

    // Navigate back to questions
    cy.contains('Questions').click();

    // Should still be authenticated on home page
    cy.url().should('include', '/home');
    cy.get('.postTitle').should('exist');
  });
});
