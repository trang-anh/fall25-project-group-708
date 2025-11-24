import { Q1_DESC, Q2_DESC, Q3_DESC, Q4_DESC } from "../../../server/testData/post_strings";
import { createQuestion, goToAskQuestion, loginUser, setupTest, teardownTest } from "../support/helpers";

describe("Cypress Tests to verify asking similar questions", () => {
    beforeEach(() => {
        setupTest();
    });
    
    afterEach(() => {
        teardownTest();
    });

    it("2.1 | Similar questions should be suggested when asking a new question", () => {
        loginUser('user123');

        // navigate to ask question page
        cy.contains('Ask a Question').click();

        // ask a question similar to Q1_DESC
        cy.,get('#formTitleInput').type('something about midterms');

        // check if the drop down appears
        cy.get('.suggestion_dropdown').should('be.visible');
        cy.get('.suggestion_dropdown').should('exist');

        // check if the questions are matching keywords
        cy.get('.suggestion_item').should('have.length.greaterThan', 0);
        cy.get('.suggestion_item').first().should('contain.text', 'something');
    });

    it('2.2 | Duplicate banner should appear but allows posting anyway', () => {
        loginUser('user123');

        cy.contains('Ask a Question').click();

        // ask a question similar to Q2_DESC
        cy.get('#formTitleInput').type('something about midterms');
        cy.get('#formTextInput').type('another questions about midterms.'); 

        // click post question button
        cy.contains('Post Question').click();
        
        // check for duplicate banner
        cy.get('.duplicate_question_banner').should('be.visible');
        cy.get('.duplicate_question_banner').should('contain.text', 'similar questions');
    })
}
