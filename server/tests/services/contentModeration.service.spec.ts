import {
  containsHatefulLanguage,
  cleanText,
  moderateContent,
} from '../../services/contentModeration.service';

describe('Content Moderation Service', () => {
  describe('containsHatefulLanguage', () => {
    test('should return false for clean text', () => {
      const result = containsHatefulLanguage('This is a nice and friendly message');
      expect(result).toBe(false);
    });

    test('should return false for empty string', () => {
      const result = containsHatefulLanguage('');
      expect(result).toBe(false);
    });

    test('should return false for null input', () => {
      const result = containsHatefulLanguage(null as any);
      expect(result).toBe(false);
    });

    test('should return false for undefined input', () => {
      const result = containsHatefulLanguage(undefined as any);
      expect(result).toBe(false);
    });

    test('should return true for text with profanity', () => {
      const result = containsHatefulLanguage('This is a fuck message');
      expect(result).toBe(true);
    });

    test('should return true for text with hateful words', () => {
      const result = containsHatefulLanguage('You are an ass');
      expect(result).toBe(true);
    });

    test('should handle text with special characters', () => {
      const result = containsHatefulLanguage('Hello! How are you? #awesome @user');
      expect(result).toBe(false);
    });

    test('should handle text with numbers', () => {
      const result = containsHatefulLanguage('The answer is 42 and it is great');
      expect(result).toBe(false);
    });
  });

  describe('cleanText', () => {
    test('should return unchanged text when no profanity detected', () => {
      const input = 'This is a clean message';
      const result = cleanText(input);
      expect(result).toBe('This is a clean message');
    });

    test('should return empty string for empty input', () => {
      const result = cleanText('');
      expect(result).toBe('');
    });

    test('should return null for null input', () => {
      const result = cleanText(null as any);
      expect(result).toBe(null);
    });

    test('should return undefined for undefined input', () => {
      const result = cleanText(undefined as any);
      expect(result).toBe(undefined);
    });

    test('should censor profanity with asterisks', () => {
      const result = cleanText('This is fuck bad');
      expect(result).toContain('***k');
      expect(result).not.toContain('damn');
    });

    test('should censor multiple instances of profanity', () => {
      const result = cleanText('This fuck thing is fuck annoying');

      // The profanity should be removed
      expect(result).not.toContain('fuck');
      expect(result).toContain('*');

      const censoredWords = result.match(/\*+/g) || [];
      expect(censoredWords.length).toBeGreaterThanOrEqual(2);
    });

    test('should maintain text structure after censoring', () => {
      const result = cleanText('Hello fuck world');

      expect(result).toMatch(/^Hello .+ world$/);
      expect(result).toContain('*');
      expect(result).not.toContain('fuck');

      expect(result.startsWith('Hello ')).toBe(true);
      expect(result.endsWith(' world')).toBe(true);
    });

    test('should censor words of different lengths correctly', () => {
      const result = cleanText('You are an ass');
      expect(result).toContain('**s');
    });

    test('should handle text with only profanity', () => {
      const result = cleanText('fuck');
      expect(result).toBe('***k');
    });
  });

  describe('moderateContent', () => {
    describe('with clean content', () => {
      test('should return no detection for clean title', () => {
        const result = moderateContent({ title: 'How to learn JavaScript' });

        expect(result.isHateful).toBe(false);
        expect(result.detectedIn).toEqual([]);
        expect(result.badWords).toEqual({});
      });

      test('should return no detection for clean text', () => {
        const result = moderateContent({ text: 'This is a helpful answer' });

        expect(result.isHateful).toBe(false);
        expect(result.detectedIn).toEqual([]);
        expect(result.badWords).toEqual({});
      });

      test('should return no detection for clean tags', () => {
        const result = moderateContent({ tags: ['javascript', 'react', 'nodejs'] });

        expect(result.isHateful).toBe(false);
        expect(result.detectedIn).toEqual([]);
        expect(result.badWords).toEqual({});
      });

      test('should return no detection for all clean fields', () => {
        const result = moderateContent({
          title: 'How to learn JavaScript',
          text: 'This is a helpful answer',
          tags: ['javascript', 'react'],
        });

        expect(result.isHateful).toBe(false);
        expect(result.detectedIn).toEqual([]);
        expect(result.badWords).toEqual({});
      });
    });

    describe('with hateful content in title', () => {
      test('should detect profanity in title', () => {
        const result = moderateContent({ title: 'This cock question' });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toContain('title');
        expect(result.badWords.title).toBeDefined();
        expect(result.badWords.title.length).toBeGreaterThan(0);
      });

      test('should list detected words in title', () => {
        const result = moderateContent({ title: 'You are a cock' });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toEqual(['title']);
        expect(result.badWords.title).toContain('coc');
      });
    });

    describe('with hateful content in text', () => {
      test('should detect profanity in text', () => {
        const result = moderateContent({ text: 'This is a cock problem' });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toContain('text');
        expect(result.badWords.text).toBeDefined();
        expect(result.badWords.text.length).toBeGreaterThan(0);
      });

      test('should list detected words in text', () => {
        const result = moderateContent({ text: 'You are an ass for asking' });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toEqual(['text']);
        expect(result.badWords.text).toContain('as');
      });
    });

    describe('with hateful content in tags', () => {
      test('should detect profanity in tags', () => {
        const result = moderateContent({ tags: ['javascript', 'cock', 'react'] });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toContain('tags');
        expect(result.badWords.tags).toBeDefined();
        expect(result.badWords.tags.length).toBeGreaterThan(0);
      });

      test('should detect profanity across multiple tags', () => {
        const result = moderateContent({ tags: ['cock', 'problem'] });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toEqual(['tags']);
      });
    });

    describe('with hateful content in multiple fields', () => {
      test('should detect profanity in both title and text', () => {
        const result = moderateContent({
          title: 'This bitch question',
          text: 'You are a fucker',
        });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toEqual(expect.arrayContaining(['title', 'text']));
        expect(result.badWords.title).toBeDefined();
        expect(result.badWords.text).toBeDefined();
      });

      test('should detect profanity in all fields', () => {
        const result = moderateContent({
          title: 'This fucking question',
          text: 'You are a whore',
          tags: ['help', 'dick'],
        });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toEqual(expect.arrayContaining(['title', 'text', 'tags']));
        expect(result.badWords.title).toBeDefined();
        expect(result.badWords.text).toBeDefined();
        expect(result.badWords.tags).toBeDefined();
      });

      test('should detect in text and tags but not title', () => {
        const result = moderateContent({
          title: 'Clean title',
          text: 'This is fuck bad',
          tags: ['ass', 'fuck'],
        });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toEqual(expect.arrayContaining(['text', 'tags']));
        expect(result.detectedIn).not.toContain('title');
      });
    });

    describe('edge cases', () => {
      test('should handle empty object', () => {
        const result = moderateContent({});

        expect(result.isHateful).toBe(false);
        expect(result.detectedIn).toEqual([]);
        expect(result.badWords).toEqual({});
      });

      test('should handle empty strings', () => {
        const result = moderateContent({
          title: '',
          text: '',
          tags: [],
        });

        expect(result.isHateful).toBe(false);
        expect(result.detectedIn).toEqual([]);
        expect(result.badWords).toEqual({});
      });

      test('should handle undefined fields', () => {
        const result = moderateContent({
          title: undefined,
          text: undefined,
          tags: undefined,
        });

        expect(result.isHateful).toBe(false);
        expect(result.detectedIn).toEqual([]);
        expect(result.badWords).toEqual({});
      });

      test('should handle whitespace-only content', () => {
        const result = moderateContent({
          title: '   ',
          text: '   ',
        });

        expect(result.isHateful).toBe(false);
      });

      test('should handle very long text', () => {
        const longText = 'Clean text '.repeat(1000) + 'fuck';
        const result = moderateContent({ text: longText });

        expect(result.isHateful).toBe(true);
        expect(result.detectedIn).toContain('text');
      });
    });

    describe('return structure', () => {
      test('should always return all three properties', () => {
        const result = moderateContent({ title: 'Clean' });

        expect(result).toHaveProperty('isHateful');
        expect(result).toHaveProperty('detectedIn');
        expect(result).toHaveProperty('badWords');
      });

      test('should return array for detectedIn', () => {
        const result = moderateContent({ title: 'damn' });

        expect(Array.isArray(result.detectedIn)).toBe(true);
      });

      test('should return object for badWords', () => {
        const result = moderateContent({ title: 'damn' });

        expect(typeof result.badWords).toBe('object');
      });
    });
  });
});
