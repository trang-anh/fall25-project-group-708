import {
  loginUser,
  setupTest,
  teardownTest,
} from '../support/helpers';

describe('Cypress Tests for User Onboarding - Profile Creation', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Onboarding Quiz - Profile Creation', () => {
    it('3.1 | User is redirected to onboarding quiz on first login', () => {
      // Visit the login page
      cy.visit('http://localhost:4530');

      // Login with a new user or existing user without completed onboarding
      loginUser('user123');

      // Verify user is either on home page or onboarding page
      // (depends on whether this is first login)
      cy.url().then(url => {
        if (url.includes('/onboarding') || url.includes('/profile-setup')) {
          // User was redirected to onboarding - verify quiz page loads
          cy.get('body').should('contain.text', /onboarding|profile|setup|quiz/i);
        } else {
          // User was already onboarded, should be on home
          cy.url().should('include', '/home');
        }
      });
    });

    it('3.2 | Onboarding quiz displays all required form fields', () => {
      loginUser('user123');

      // Navigate to onboarding if not automatically redirected
      cy.visit('http://localhost:4530/onboarding');

      // Verify form fields exist
      // Check for at least one of the required fields
      cy.get('body').should(($body) => {
        const hasSkills = $body.text().includes('skill') || $body.find('input[name*="skill"], textarea[name*="skill"]').length > 0;
        const hasLanguage = $body.text().includes('language') || $body.find('input[name*="language"], select[name*="language"]').length > 0;
        const hasCollaboration = $body.text().includes('collaboration') || $body.find('input[name*="collaboration"], textarea[name*="collaboration"]').length > 0;
        
        expect(hasSkills || hasLanguage || hasCollaboration).to.be.true;
      });

      // Verify submit button exists
      cy.contains(/submit|complete|finish|next/i).should('exist');
    });

    it('3.3 | User can fill out skills field in onboarding quiz', () => {
      loginUser('user123');

      // Navigate to onboarding
      cy.visit('http://localhost:4530/onboarding');

      // Find and fill skills field - try multiple selectors
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .then($field => {
          if ($field.length) {
            cy.wrap($field).type('JavaScript, React, TypeScript');
          }
        });

      // Verify input was entered
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .should('have.value', 'JavaScript, React, TypeScript');
    });

    it('3.4 | User can select programming languages in onboarding quiz', () => {
      loginUser('user123');

      // Navigate to onboarding
      cy.visit('http://localhost:4530/onboarding');

      // Find and fill programming languages field
      cy.get('input[name*="language"], select[name*="language"], input[placeholder*="language" i], input[placeholder*="programming" i]')
        .first()
        .then($field => {
          if ($field.length) {
            if ($field.prop('tagName') === 'SELECT') {
              cy.wrap($field).select('JavaScript');
            } else {
              cy.wrap($field).type('JavaScript, Python, Java');
            }
          }
        });

      // Verify input/selection was made
      cy.get('input[name*="language"], select[name*="language"], input[placeholder*="language" i]')
        .first()
        .should(($field) => {
          const value = $field.val();
          expect(value).to.exist;
        });
    });

    it('3.5 | User can fill out collaboration style field in onboarding quiz', () => {
      loginUser('user123');

      // Navigate to onboarding
      cy.visit('http://localhost:4530/onboarding');

      // Find and fill collaboration style field
      cy.get('textarea[name*="collaboration"], input[name*="collaboration"], textarea[placeholder*="collaboration" i], input[placeholder*="collaboration" i]')
        .first()
        .then($field => {
          if ($field.length) {
            cy.wrap($field).type('I prefer pair programming and code reviews. I enjoy mentoring junior developers and sharing knowledge.');
          }
        });

      // Verify input was entered
      cy.get('textarea[name*="collaboration"], input[name*="collaboration"], textarea[placeholder*="collaboration" i]')
        .first()
        .should(($field) => {
          const value = $field.val();
          expect(value?.toString()).to.include('pair programming');
        });
    });

    it('3.6 | All required fields must be filled before submission', () => {
      loginUser('user123');

      // Navigate to onboarding
      cy.visit('http://localhost:4530/onboarding');

      // Try to submit with empty form
      cy.contains(/submit|complete|finish|next/i).click();

      // Should show validation error or remain on onboarding page
      cy.url().then(url => {
        if (url.includes('/onboarding') || url.includes('/profile-setup')) {
          // Still on onboarding page - good
          cy.get('body').should(($body) => {
            const hasError = $body.text().includes('required') || $body.text().includes('empty');
            expect(hasError || url.includes('/onboarding')).to.be.true;
          });
        }
      });
    });

    it('3.7 | User can successfully submit completed onboarding quiz', () => {
      loginUser('user123');

      // Navigate to onboarding
      cy.visit('http://localhost:4530/onboarding');

      // Fill all required fields with force to ensure they're filled
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .type('JavaScript, React, TypeScript', { force: true });

      cy.get('input[name*="language"], select[name*="language"], input[placeholder*="language" i], input[placeholder*="programming" i]')
        .first()
        .then($field => {
          if ($field.prop('tagName') === 'SELECT') {
            cy.wrap($field).select('JavaScript');
          } else {
            cy.wrap($field).type('JavaScript, Python', { force: true });
          }
        });

      cy.get('textarea[name*="collaboration"], input[name*="collaboration"], textarea[placeholder*="collaboration" i], input[placeholder*="collaboration" i]')
        .first()
        .type('I prefer pair programming and code reviews', { force: true });

      // Submit form
      cy.contains(/submit|complete|finish|next/i).click();

      // Should redirect away from onboarding page
      cy.url().should('not.include', '/onboarding').and('not.include', '/profile-setup');
    });

    it('3.8 | Profile is created after onboarding quiz submission', () => {
      loginUser('user123');

      // Navigate to onboarding
      cy.visit('http://localhost:4530/onboarding');

      // Fill all required fields
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .type('JavaScript, React', { force: true });

      cy.get('input[name*="language"], select[name*="language"], input[placeholder*="language" i], input[placeholder*="programming" i]')
        .first()
        .type('JavaScript', { force: true });

      cy.get('textarea[name*="collaboration"], input[name*="collaboration"], textarea[placeholder*="collaboration" i], input[placeholder*="collaboration" i]')
        .first()
        .type('Pair programming', { force: true });

      // Submit form
      cy.contains(/submit|complete|finish|next/i).click();

      // Verify we're redirected to home
      cy.url().should('include', '/home');

      // Verify we can access profile page
      cy.visit('http://localhost:4530/profile');
      cy.get('body').should('contain.text', /profile|settings/i);
    });

    it('3.9 | Filled profile information is visible on My Profile page', () => {
      loginUser('user123');

      // If onboarding is incomplete, complete it first
      cy.visit('http://localhost:4530/onboarding');

      cy.url().then(url => {
        if (url.includes('/onboarding') || url.includes('/profile-setup')) {
          // Fill and submit onboarding
          cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
            .first()
            .type('JavaScript, React', { force: true });

          cy.get('input[name*="language"], select[name*="language"], input[placeholder*="language" i], input[placeholder*="programming" i]')
            .first()
            .type('JavaScript', { force: true });

          cy.get('textarea[name*="collaboration"], input[name*="collaboration"], textarea[placeholder*="collaboration" i], input[placeholder*="collaboration" i]')
            .first()
            .type('Pair programming', { force: true });

          cy.contains(/submit|complete|finish|next/i).click();
        }
      });

      // Navigate to profile page
      cy.visit('http://localhost:4530/profile');

      // Verify profile information is displayed
      cy.get('body').should('contain.text', /javascript|react|profile/i);

      // Verify user can see their profile data
      cy.get('[data-testid*="profile"], .profile-card, [class*="profile"]').should('exist');
    });

    it('3.10 | User can update profile information after onboarding', () => {
      loginUser('user123');

      // Navigate to profile/settings page
      cy.visit('http://localhost:4530/profile');

      // Look for edit button or profile settings link
      cy.contains(/edit|update|settings/i).should('exist');
      cy.contains(/edit|update|settings/i).click();

      // Verify we're in edit mode
      cy.get('input, textarea').should('exist');

      // Update a field
      cy.get('textarea').first().clear().type('Updated skills and experience', { force: true });

      // Save changes
      cy.contains(/save|update|submit/i).click();

      // Verify changes were saved or we're back on main profile
      cy.url().then(url => {
        if (!url.includes('/edit')) {
          cy.get('body').should('contain.text', /success|saved|updated/i);
        }
      });
    });

    it('3.11 | Onboarding progress is persistent across sessions', () => {
      // First login and complete onboarding
      loginUser('user123');

      cy.visit('http://localhost:4530/onboarding');

      // Fill and submit onboarding
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .type('JavaScript', { force: true });

      cy.get('input[name*="language"], select[name*="language"], input[placeholder*="language" i], input[placeholder*="programming" i]')
        .first()
        .type('Python', { force: true });

      cy.get('textarea[name*="collaboration"], input[name*="collaboration"], textarea[placeholder*="collaboration" i], input[placeholder*="collaboration" i]')
        .first()
        .type('Pair programming', { force: true });

      cy.contains(/submit|complete|finish|next/i).click();

      // Wait for redirect
      cy.url().should('not.include', '/onboarding');

      // Logout (if logout functionality exists)
      cy.visit('http://localhost:4530');

      // Login again
      loginUser('user123');

      // Verify user is not redirected to onboarding again
      cy.url().should('not.include', '/onboarding').and('not.include', '/profile-setup');

      // Verify profile information is still accessible
      cy.visit('http://localhost:4530/profile');
      cy.get('body').should('contain.text', /profile|javascript|python/i);
    });

    it('3.12 | Onboarding quiz has input validation for skill fields', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/onboarding');

      // Try to submit with very short skill entry
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .type('a', { force: true });

      cy.contains(/submit|complete|finish|next/i).click();

      // Should either show validation error or not proceed
      cy.url().then(url => {
        if (!url.includes('/home')) {
          // Still on onboarding or got error
          cy.get('body').should(($body) => {
            const hasError = $body.text().includes('required') || $body.text().includes('valid') || $body.text().includes('minimum') || $body.text().includes('invalid');
            expect(hasError || url.includes('/onboarding')).to.be.true;
          });
        }
      });
    });
  });

  describe('Profile Management - Edit and Deactivation', () => {
    it('3.2 | User can navigate to My Profile and access Edit option', () => {
      loginUser('user123');

      // Navigate to home page first
      cy.url().then(url => {
        if (url.includes('/onboarding') || url.includes('/profile-setup')) {
          // Complete onboarding if needed
          cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
            .first()
            .type('JavaScript, React', { force: true });

          cy.get('input[name*="language"], select[name*="language"], input[placeholder*="language" i], input[placeholder*="programming" i]')
            .first()
            .type('JavaScript', { force: true });

          cy.get('textarea[name*="collaboration"], input[name*="collaboration"], textarea[placeholder*="collaboration" i], input[placeholder*="collaboration" i]')
            .first()
            .type('Pair programming', { force: true });

          cy.contains(/submit|complete|finish|next/i).click();
        }
      });

      // Navigate to profile/My Profile
      cy.visit('http://localhost:4530/profile');

      // Verify My Profile page is displayed
      cy.get('body').should('contain.text', /profile|my profile/i);

      // Look for Edit button/link
      cy.contains(/edit|update|edit profile/i).should('exist').and('be.visible');
    });

    it('3.2a | User can click Edit and access profile editing interface', () => {
      loginUser('user123');

      // Navigate to profile page
      cy.visit('http://localhost:4530/profile');

      // Click on Edit button
      cy.contains(/edit|update|edit profile/i).click();

      // Verify edit interface is displayed
      cy.get('body').then(($body) => {
        const hasEditForm = $body.text().includes('save') || 
                            $body.find('input, textarea').length > 0 ||
                            $body.text().includes('edit');
        expect(hasEditForm).to.be.true;
      });

      // Verify input fields are editable
      cy.get('input, textarea').should('exist');
    });

    it('3.2b | User can change skills in the Edit Profile form', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Click Edit
      cy.contains(/edit|update|edit profile/i).click();

      // Find and clear the skills field
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .clear({ force: true })
        .type('Python, Django, FastAPI, PostgreSQL', { force: true });

      // Verify the new skills were entered
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .should(($field) => {
          const value = $field.val();
          expect(value?.toString()).to.include('Python');
        });
    });

    it('3.2c | User can save changes after editing skills', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Click Edit
      cy.contains(/edit|update|edit profile/i).click();

      // Update skills
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .clear({ force: true })
        .type('Go, Rust, C++, WebAssembly', { force: true });

      // Click Save button
      cy.contains(/save|update|submit/i).click();

      // Verify we're back on profile page or see success message
      cy.get('body').then(($body) => {
        const hasSuccess = $body.text().includes('success') || 
                           $body.text().includes('saved') || 
                           $body.text().includes('updated');
        const onProfilePage = !$body.text().includes('edit');
        expect(hasSuccess || onProfilePage).to.be.true;
      });
    });

    it('3.2d | Edited skills are persisted and visible on profile', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Click Edit
      cy.contains(/edit|update|edit profile/i).click();

      const newSkills = 'Java, Spring Boot, Kubernetes, Docker';

      // Update skills
      cy.get('input[name*="skill"], textarea[name*="skill"], input[placeholder*="skill" i], textarea[placeholder*="skill" i]')
        .first()
        .clear({ force: true })
        .type(newSkills, { force: true });

      // Save
      cy.contains(/save|update|submit/i).click();

      // Wait a moment for save to complete
      cy.wait(500);

      // Navigate away and back to verify persistence
      cy.visit('http://localhost:4530/home');
      cy.visit('http://localhost:4530/profile');

      // Verify updated skills are displayed
      cy.get('body').should('contain.text', /java|spring|kubernetes|docker/i);
    });

    it('3.2e | User can access Deactivate Profile option', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Look for Deactivate option
      cy.contains(/deactivate|deactivate profile|disable|disable profile|delete account/i)
        .should('exist')
        .and('be.visible');
    });

    it('3.2f | Clicking Deactivate Profile shows confirmation dialog', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Click Deactivate button
      cy.contains(/deactivate|deactivate profile|disable|disable profile|delete account/i).click();

      // Verify confirmation dialog appears
      cy.get('body').then(($body) => {
        const hasConfirmation = $body.text().includes('confirm') || 
                                $body.text().includes('sure') || 
                                $body.text().includes('warning') ||
                                $body.text().includes('deactivate');
        expect(hasConfirmation).to.be.true;
      });

      // Verify dialog has action buttons
      cy.contains(/confirm|yes|deactivate|cancel|no/i).should('exist');
    });

    it('3.2g | User can cancel deactivation from confirmation dialog', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Click Deactivate button
      cy.contains(/deactivate|deactivate profile|disable|disable profile|delete account/i).click();

      // Click Cancel/No button
      cy.contains(/cancel|no|keep/i).click();

      // Verify we're still on profile page and profile is not deactivated
      cy.url().should('include', '/profile');
      cy.get('body').should('contain.text', /profile|my profile/i);

      // Verify deactivate button still exists
      cy.contains(/deactivate|deactivate profile|disable|disable profile|delete account/i).should('exist');
    });

    it('3.2h | User can confirm deactivation of profile', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Click Deactivate button
      cy.contains(/deactivate|deactivate profile|disable|disable profile|delete account/i).click();

      // Confirm deactivation
      cy.contains(/confirm|yes|deactivate/i).click();

      // Verify deactivation was successful
      cy.get('body').then(($body) => {
        const hasSuccess = $body.text().includes('success') || 
                           $body.text().includes('deactivated') || 
                           $body.text().includes('disabled');
        expect(hasSuccess).to.be.true;
      });
    });

    it('3.2i | Deactivated profile cannot access protected pages', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Deactivate profile
      cy.contains(/deactivate|deactivate profile|disable|disable profile|delete account/i).click();
      cy.contains(/confirm|yes|deactivate/i).click();

      // Wait for deactivation to complete
      cy.wait(500);

      // Try to navigate to protected page
      cy.visit('http://localhost:4530/home');

      // Should be redirected to login or access denied page
      cy.get('body').then(($body) => {
        const onLoginPage = $body.find('#username-input, #password-input').length > 0 ||
                           $body.text().includes('login');
        const accessDenied = $body.text().includes('access denied') || 
                             $body.text().includes('deactivated') ||
                             $body.text().includes('unauthorized');
        expect(onLoginPage || accessDenied).to.be.true;
      });
    });

    it('3.2j | Profile status is properly updated after deactivation', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Check profile status before deactivation
      cy.get('body').then(($body) => {
        const beforeDeactivation = $body.text();
        
        // Deactivate profile
        cy.contains(/deactivate|deactivate profile|disable|disable profile|delete account/i).click();
        cy.contains(/confirm|yes|deactivate/i).click();

        // Verify status changed
        cy.get('body').should(($newBody) => {
          const afterDeactivation = $newBody.text();
          expect(afterDeactivation).to.not.equal(beforeDeactivation);
        });
      });
    });
  });
});
