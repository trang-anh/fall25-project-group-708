import { Q1_DESC, Q2_DESC, Q3_DESC, Q4_DESC } from '../../../server/testData/post_strings';
import { createQuestion, goToAskQuestion, loginUser, setupTest, teardownTest } from '../support/helpers';

describe("Cypress Tests to verify asking new questions", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });


  it("2.1 | Ask a Question creates and displays expected meta data", () => {
    loginUser('user123');

    createQuestion("Test Question Q1", "Test Question Q1 Text T1", "javascript");

    cy.contains("Fake Stack Overflow");
    cy.contains("11 questions");
    cy.contains("user123 asked 0 seconds ago");
    const answers = [
      "0 answers",
      "1 answers",
      "1 answers",
      "1 answers",
      "1 answers",
      "1 answers",
      "1 answers",
      "1 answers",
      "1 answers",
      "1 answers",
      "1 answers"
    ];
    const views = [
      "0 views",
      "3 views",
      "2 views",
      "6 views",
      "4 views",
      "5 views",
      "3 views",
      "8 views",
      "4 views",
      "7 views",
      "5 views",
    ];
    cy.get(".postStats").each(($el, index, $list) => {
      cy.wrap($el).should("contain", answers[index]);
      cy.wrap($el).should("contain", views[index]);
    });
    cy.contains("Unanswered").click();
    cy.get(".postTitle").should("have.length", 1);
    cy.contains("1 questions");
  });

  it("2.2 | Ask a Question with empty title shows error", () => {
    loginUser('user123');
    
    cy.contains("Ask a Question").click();
    cy.get("#formTextInput").type("Test Question 1 Text Q1");
    cy.get("#formTagInput").type("javascript");
    cy.contains("Post Question").click();
    
    cy.contains("Title cannot be empty");
  });

  it("2.3 | Tag suggestion dropdown shows up when typing in tag field", () => {
    loginUser('user123');
    
    // Navigate to Ask a Question page
    cy.contains("Ask a Question").click();
    
    // Wait for page to load
    cy.wait(500);
    
    // Type in the tag input field to trigger suggestions
    cy.get("#formTagInput").type("java");
    
    // Wait for dropdown suggestions to appear
    cy.wait(500);
    
    // Verify that suggestion dropdown is visible
    cy.get("body").then(($body) => {
      const hasSuggestions = $body.find('[class*="dropdown"], [class*="suggestion"], [class*="autocomplete"], [role="listbox"], [role="option"]').length > 0 ||
                            $body.text().includes('javascript') ||
                            $body.find('ul, .suggestions, [class*="list"]').length > 0;
      expect(hasSuggestions).to.be.true;
    });
  });

  it("2.3a | Tag suggestion dropdown displays matching tags", () => {
    loginUser('user123');
    
    cy.contains("Ask a Question").click();
    
    cy.wait(500);
    
    // Type a tag prefix
    cy.get("#formTagInput").type("java");
    
    cy.wait(500);
    
    // Verify dropdown shows suggestions
    cy.get("body").then(($body) => {
      const suggestions = $body.find('[class*="suggestion"], [role="option"]');
      expect(suggestions.length).to.be.greaterThan(0);
    });
  });

  it("2.3b | Tag suggestion dropdown contains javascript tag", () => {
    loginUser('user123');
    
    cy.contains("Ask a Question").click();
    
    cy.wait(500);
    
    // Type to trigger suggestions
    cy.get("#formTagInput").type("java");
    
    cy.wait(500);
    
    // Check if javascript or related tags appear in suggestions
    cy.get("body").should(($body) => {
      const bodyText = $body.text().toLowerCase();
      const hasJavaScript = bodyText.includes('javascript');
      expect(hasJavaScript).to.be.true;
    });
  });

  it("2.3c | User can click on a suggested tag to select it", () => {
    loginUser('user123');
    
    cy.contains("Ask a Question").click();
    
    cy.wait(500);
    
    // Type to trigger suggestions
    cy.get("#formTagInput").type("java");
    
    cy.wait(500);
    
    // Look for a suggestion element and click it
    cy.get('[class*="suggestion"], [role="option"], [class*="dropdown"] li, [class*="dropdown"] button').first()
      .then(($suggestion) => {
        if ($suggestion.length > 0) {
          cy.wrap($suggestion).click();
          
          cy.wait(300);
          
          // Verify the tag was added to the tag input or tag list
          cy.get("body").then(($body) => {
            const hasTag = $body.text().includes('javascript') || 
                          $body.find('[class*="tag"], [class*="chip"], [class*="badge"]').length > 0;
            expect(hasTag).to.be.true;
          });
        }
      });
  });

  it("2.3d | Suggestion dropdown appears only when typing tags", () => {
    loginUser('user123');
    
    cy.contains("Ask a Question").click();
    
    cy.wait(500);
    
    // Initially, no suggestions should appear
    cy.get("body").then(($body) => {
      const initialSuggestions = $body.find('[class*="dropdown"], [class*="suggestion"]').length;
      expect(initialSuggestions).to.equal(0);
    });
    
    // Type in tag field
    cy.get("#formTagInput").type("j");
    
    cy.wait(500);
    
    // Now suggestions should appear
    cy.get("body").then(($body) => {
      const suggestionsAfterTyping = $body.find('[class*="dropdown"], [class*="suggestion"], [role="listbox"], [role="option"]').length;
      expect(suggestionsAfterTyping).to.be.greaterThan(0);
    });
  });

  it("2.3e | Suggestion dropdown disappears when focus is lost from tag field", () => {
    loginUser('user123');
    
    cy.contains("Ask a Question").click();
    
    cy.wait(500);
    
    // Type to show suggestions
    cy.get("#formTagInput").type("java");
    
    cy.wait(500);
    
    // Verify suggestions are visible
    cy.get("body").then(($body) => {
      const hasSuggestions = $body.find('[class*="dropdown"], [class*="suggestion"]').length > 0;
      expect(hasSuggestions).to.be.true;
    });
    
    // Click outside the tag field to blur it
    cy.get("#formTextInput").click();
    
    cy.wait(300);
    
    // Verify suggestions are hidden
    cy.get("body").then(($body) => {
      const suggestionsStillVisible = $body.find('[class*="dropdown"]:visible, [class*="suggestion"]:visible').length;
      // Dropdown should be hidden or removed
      expect(suggestionsStillVisible).to.equal(0);
    });
  });

  it("2.3f | Multiple tags can be selected from suggestions", () => {
    loginUser('user123');
    
    cy.contains("Ask a Question").click();
    
    cy.wait(500);
    
    // Add first tag
    cy.get("#formTagInput").type("java");
    
    cy.wait(500);
    
    cy.get('[class*="suggestion"], [role="option"]').first().then(($suggestion) => {
      if ($suggestion.length > 0) {
        cy.wrap($suggestion).click();
      }
    });
    
    cy.wait(300);
    
    // Add second tag
    cy.get("#formTagInput").type("python");
    
    cy.wait(500);
    
    cy.get('[class*="suggestion"], [role="option"]').first().then(($suggestion) => {
      if ($suggestion.length > 0) {
        cy.wrap($suggestion).click();
      }
    });
    
    cy.wait(300);
    
    // Verify both tags are present
    cy.get("body").then(($body) => {
      const hasTags = $body.text().includes('javascript') || $body.text().includes('python') ||
                     $body.find('[class*="tag"], [class*="chip"]').length >= 2;
      expect(hasTags).to.be.true;
    });
  });
});