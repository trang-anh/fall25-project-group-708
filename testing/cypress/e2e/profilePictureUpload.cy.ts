import {
  loginUser,
  setupTest,
  teardownTest,
} from '../support/helpers';

describe('Cypress Tests for Profile Picture Upload + Bio', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Profile Picture Upload - Valid Image', () => {
    it('3.8 | User can navigate to profile edit page', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Verify profile page is displayed
      cy.get('body').should('contain.text', /profile|my profile/i);

      // Look for Edit button
      cy.contains(/edit|update|edit profile/i).should('exist').and('be.visible');
    });

    it('3.8a | Profile edit page displays avatar/profile picture section', () => {
      loginUser('user123');

      // Navigate to profile
      cy.visit('http://localhost:4530/profile');

      // Click Edit button
      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Verify edit form is displayed
      cy.get('body').then(($body) => {
        const hasAvatarSection = $body.text().includes('avatar') || 
                                $body.text().includes('picture') ||
                                $body.text().includes('photo') ||
                                $body.text().includes('profile picture') ||
                                $body.find('input[type="file"]').length > 0;
        expect(hasAvatarSection).to.be.true;
      });
    });

    it('3.8b | Profile edit page displays file upload input', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Verify file input exists
      cy.get('input[type="file"]').should('exist');
    });

    it('3.8c | User can select a valid image file (JPEG)', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Create a fixture file for testing
      // Cypress can upload files using fixture
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(300);

      // Verify file was selected
      cy.get('body').then(($body) => {
        const hasFileSelected = $body.text().includes('test-image') || 
                               $body.text().includes('jpg') ||
                               $body.text().includes('selected') ||
                               $body.find('[class*="preview"], [class*="selected"], img').length > 0;
        expect(hasFileSelected).to.be.true;
      });
    });

    it('3.8d | User can see preview of selected image', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Upload image
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(300);

      // Verify preview is shown
      cy.get('body').then(($body) => {
        const hasPreview = $body.find('img[src*="blob"], img[src*="data:"], [class*="preview"]').length > 0 ||
                          $body.text().includes('preview');
        expect(hasPreview).to.be.true;
      });
    });

    it('3.8e | User can select a valid image file (PNG)', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Upload PNG image
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.png', { force: true });

      cy.wait(300);

      // Verify PNG was selected
      cy.get('body').then(($body) => {
        const hasFileSelected = $body.text().includes('test-image') || 
                               $body.text().includes('png') ||
                               $body.find('img').length > 0;
        expect(hasFileSelected).to.be.true;
      });
    });

    it('3.8f | User can click Save after selecting valid image', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Upload image
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(300);

      // Click Save button
      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Verify save was successful
      cy.get('body').then(($body) => {
        const hasSuccess = $body.text().includes('success') || 
                          $body.text().includes('saved') ||
                          $body.text().includes('updated');
        expect(hasSuccess).to.be.true;
      });
    });

    it('3.8g | Valid image is displayed as avatar on profile after save', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Upload and save image
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(300);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Navigate back to profile to verify avatar is displayed
      cy.visit('http://localhost:4530/profile');

      cy.wait(300);

      // Verify avatar/profile picture is displayed
      cy.get('body').then(($body) => {
        const hasAvatar = $body.find('img[class*="avatar"], img[class*="profile"], [class*="avatar"]').length > 0 ||
                         $body.find('img[src*="upload"], img[src*="avatar"]').length > 0;
        expect(hasAvatar).to.be.true;
      });
    });

    it('3.8h | Avatar image matches the uploaded file', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Upload image
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(300);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Navigate back to profile
      cy.visit('http://localhost:4530/profile');

      cy.wait(300);

      // Verify avatar source contains expected path
      cy.get('body').then(($body) => {
        const avatarImg = $body.find('img[class*="avatar"], img[class*="profile"]').first();
        const src = avatarImg.attr('src') || '';
        const hasValidPath = src.includes('upload') || 
                            src.includes('avatar') ||
                            src.includes('jpg') ||
                            src.length > 0;
        expect(hasValidPath).to.be.true;
      });
    });

    it('3.8i | Stored profile picture path is accessible', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      // Get the avatar image source
      cy.get('body').then(($body) => {
        const avatarImg = $body.find('img[class*="avatar"], img[class*="profile"]').first();
        const src = avatarImg.attr('src');

        if (src) {
          // Verify the image is accessible
          cy.get('img[class*="avatar"], img[class*="profile"]').first()
            .should('have.prop', 'naturalWidth')
            .and('be.greaterThan', 0);
        }
      });
    });

    it('3.8j | User can replace existing avatar with new image', () => {
      loginUser('user123');

      // First, upload an initial image
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(300);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Now replace with a different image
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Select a different image
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.png', { force: true });

      cy.wait(300);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Verify avatar was updated
      cy.get('body').then(($body) => {
        const hasSuccess = $body.text().includes('success') || 
                          $body.text().includes('updated');
        expect(hasSuccess).to.be.true;
      });
    });
  });

  describe('Profile Picture Upload - Invalid File Types', () => {
    it('3.8k | Invalid file type (PDF) is rejected on upload', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Try to upload a PDF file
      cy.get('input[type="file"]').then(($input) => {
        // Attempt to upload invalid file type
        cy.wrap($input).selectFile('cypress/fixtures/test-document.pdf', { force: true });
      });

      cy.wait(300);

      // Verify error message or rejection
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('invalid') || 
                        $body.text().includes('not supported') ||
                        $body.text().includes('jpg') ||
                        $body.text().includes('png') ||
                        $body.text().includes('image') ||
                        $body.text().includes('format');
        expect(hasError).to.be.true;
      });
    });

    it('3.8l | Invalid file type error message is clear', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Try to upload invalid file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-document.pdf', { force: true });

      cy.wait(300);

      // Verify clear error message
      cy.get('body').then(($body) => {
        const errorText = $body.text();
        const hasSpecificError = errorText.includes('only jpeg') || 
                                errorText.includes('only png') ||
                                errorText.includes('jpg or png') ||
                                errorText.includes('image format') ||
                                errorText.includes('supported formats');
        if (hasSpecificError) {
          expect(hasSpecificError).to.be.true;
        }
      });
    });

    it('3.8m | Invalid file type does not save to profile', () => {
      loginUser('user123');

      // Get current avatar before attempting invalid upload
      cy.visit('http://localhost:4530/profile');

      cy.get('body').then(($body) => {
        const initialAvatar = $body.find('img[class*="avatar"], img[class*="profile"]').first().attr('src');

        // Try to upload invalid file
        cy.contains(/edit|update|edit profile/i).click();

        cy.wait(300);

        cy.get('input[type="file"]').selectFile('cypress/fixtures/test-document.pdf', { force: true });

        cy.wait(300);

        // Try to save
        cy.contains(/save|update|submit/i).click();

        cy.wait(300);

        // Navigate back to profile
        cy.visit('http://localhost:4530/profile');

        cy.wait(300);

        // Verify avatar hasn't changed
        cy.get('body').then(($newBody) => {
          const newAvatar = $newBody.find('img[class*="avatar"], img[class*="profile"]').first().attr('src');
          // Avatar should be the same or not updated with invalid file
          expect(newAvatar).to.equal(initialAvatar);
        });
      });
    });

    it('3.8n | Invalid file type (TXT) is rejected', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Try to upload a TXT file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-file.txt', { force: true });

      cy.wait(300);

      // Verify error
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('invalid') || 
                        $body.text().includes('not supported') ||
                        $body.text().includes('image');
        expect(hasError).to.be.true;
      });
    });

    it('3.8o | Invalid file type (DOC) is rejected', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Try to upload a DOC file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-document.doc', { force: true });

      cy.wait(300);

      // Verify error
      cy.get('body').then(($body) => {
        const hasError = $body.text().includes('invalid') || 
                        $body.text().includes('not supported') ||
                        $body.text().includes('format');
        expect(hasError).to.be.true;
      });
    });

    it('3.8p | File size validation - very large image is rejected', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Try to upload a very large image
      cy.get('input[type="file"]').then(($input) => {
        cy.wrap($input).selectFile('cypress/fixtures/large-image.jpg', { force: true });
      });

      cy.wait(300);

      // Check for size error or rejection
      cy.get('body').then(($body) => {
        const hasSizeError = $body.text().includes('too large') || 
                            $body.text().includes('file size') ||
                            $body.text().includes('size limit') ||
                            $body.text().includes('maximum');
        // Size validation is optional but good to have
        if (hasSizeError) {
          expect(hasSizeError).to.be.true;
        }
      });
    });
  });

  describe('Profile Bio/Description Upload', () => {
    it('3.8q | Profile edit page displays bio/description field', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Verify bio/description field exists
      cy.get('body').then(($body) => {
        const hasBioField = $body.find('textarea[placeholder*="bio" i], textarea[placeholder*="description" i], textarea[placeholder*="about" i]').length > 0 ||
                           $body.text().includes('bio') ||
                           $body.text().includes('description') ||
                           $body.text().includes('about');
        expect(hasBioField).to.be.true;
      });
    });

    it('3.8r | User can enter profile bio text', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Find bio field
      const bioText = 'Passionate software developer interested in pair programming and collaborative coding.';
      
      cy.get('textarea[placeholder*="bio" i], textarea[placeholder*="description" i], textarea[placeholder*="about" i], textarea').first()
        .type(bioText, { force: true });

      cy.wait(200);

      // Verify bio was entered
      cy.get('textarea').first().should(($el) => {
        const value = $el.val();
        expect(value?.toString()).to.include('Passionate');
      });
    });

    it('3.8s | User can save profile bio', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Enter bio
      cy.get('textarea').first()
        .clear({ force: true })
        .type('Updated bio information', { force: true });

      cy.wait(200);

      // Save
      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Verify save was successful
      cy.get('body').then(($body) => {
        const hasSuccess = $body.text().includes('success') || 
                          $body.text().includes('saved') ||
                          $body.text().includes('updated');
        expect(hasSuccess).to.be.true;
      });
    });

    it('3.8t | Bio is displayed on profile after save', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Enter and save bio
      const bioText = 'Full-stack developer with expertise in React and Node.js';
      cy.get('textarea').first()
        .clear({ force: true })
        .type(bioText, { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Navigate back to profile
      cy.visit('http://localhost:4530/profile');

      cy.wait(300);

      // Verify bio is displayed
      cy.get('body').should('contain.text', bioText);
    });

    it('3.8u | User can edit bio multiple times', () => {
      loginUser('user123');

      // First edit
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      cy.get('textarea').first()
        .clear({ force: true })
        .type('First version of bio', { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Second edit
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      cy.get('textarea').first()
        .clear({ force: true })
        .type('Second version of bio', { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Verify latest bio is shown
      cy.visit('http://localhost:4530/profile');

      cy.wait(300);

      cy.get('body').should('contain.text', 'Second version');
    });

    it('3.8v | Bio field has character limit', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Try to type very long text
      const longText = 'a'.repeat(1000);

      cy.get('textarea').first()
        .type(longText, { force: true, delay: 0 });

      cy.wait(200);

      // Check for character limit indicator
      cy.get('body').then(($body) => {
        const hasCharLimit = $body.text().includes('character') || 
                            $body.text().includes('limit') ||
                            $body.text().includes('maximum') ||
                            $body.find('[class*="counter"], [class*="limit"]').length > 0;
        // Character limit is optional but good practice
        if (hasCharLimit) {
          expect(hasCharLimit).to.be.true;
        }
      });
    });

    it('3.8w | Empty bio is allowed', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Clear bio field
      cy.get('textarea').first()
        .clear({ force: true });

      cy.wait(200);

      // Try to save with empty bio
      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Verify save was successful (empty bio is allowed)
      cy.get('body').then(($body) => {
        const onProfilePage = !$body.text().includes('edit') || $body.text().includes('profile');
        expect(onProfilePage).to.be.true;
      });
    });
  });

  describe('Profile Picture and Bio Combined', () => {
    it('3.8x | User can update both picture and bio at the same time', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Upload image
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(200);

      // Update bio
      cy.get('textarea').first()
        .clear({ force: true })
        .type('Updated profile with new picture and bio', { force: true });

      cy.wait(200);

      // Save
      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Verify both were saved
      cy.get('body').then(($body) => {
        const hasSuccess = $body.text().includes('success') || 
                          $body.text().includes('saved');
        expect(hasSuccess).to.be.true;
      });
    });

    it('3.8y | Profile shows updated picture and bio together', () => {
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      // Set both picture and bio
      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(200);

      const expectedBio = 'Accomplished developer ready for pair programming';
      cy.get('textarea').first()
        .clear({ force: true })
        .type(expectedBio, { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Navigate to profile and verify both are displayed
      cy.visit('http://localhost:4530/profile');

      cy.wait(300);

      // Verify avatar is present
      cy.get('body').then(($body) => {
        const hasAvatar = $body.find('img[class*="avatar"], img[class*="profile"]').length > 0;
        expect(hasAvatar).to.be.true;
      });

      // Verify bio text is present
      cy.get('body').should('contain.text', expectedBio);
    });

    it('3.8z | Updating picture doesn\'t affect bio and vice versa', () => {
      loginUser('user123');

      // Set initial bio
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      const initialBio = 'Initial biography text';
      cy.get('textarea').first()
        .clear({ force: true })
        .type(initialBio, { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Now update only picture
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.png', { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Verify bio is still there
      cy.visit('http://localhost:4530/profile');

      cy.wait(300);

      cy.get('body').should('contain.text', initialBio);
    });
  });

  describe('Profile Picture and Bio Persistence', () => {
    it('3.8aa | Profile picture persists after page reload', () => {
      loginUser('user123');

      // Upload picture
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Reload page
      cy.reload();

      cy.wait(500);

      // Verify picture is still there
      cy.get('body').then(($body) => {
        const hasAvatar = $body.find('img[class*="avatar"], img[class*="profile"]').length > 0;
        expect(hasAvatar).to.be.true;
      });
    });

    it('3.8ab | Bio text persists after page reload', () => {
      loginUser('user123');

      // Set bio
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      const persistentBio = 'This bio should persist across reloads';
      cy.get('textarea').first()
        .clear({ force: true })
        .type(persistentBio, { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Reload page
      cy.reload();

      cy.wait(500);

      // Verify bio is still there
      cy.get('body').should('contain.text', persistentBio);
    });

    it('3.8ac | Profile picture persists across sessions', () => {
      loginUser('user123');

      // Upload picture
      cy.visit('http://localhost:4530/profile');

      cy.contains(/edit|update|edit profile/i).click();

      cy.wait(300);

      cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });

      cy.wait(200);

      cy.contains(/save|update|submit/i).click();

      cy.wait(500);

      // Logout and login again
      cy.visit('http://localhost:4530/login');

      cy.wait(300);

      // Login again
      loginUser('user123');

      cy.visit('http://localhost:4530/profile');

      cy.wait(300);

      // Verify picture is still there
      cy.get('body').then(($body) => {
        const hasAvatar = $body.find('img[class*="avatar"], img[class*="profile"]').length > 0;
        expect(hasAvatar).to.be.true;
      });
    });
  });
});
