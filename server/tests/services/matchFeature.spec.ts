import extractFeatures from '../../services/matchFeature.service';
import { MatchProfileWithUser } from '../../types/types';

// Helper to create a fully valid profile
function makeProfile(overrides: Partial<MatchProfileWithUser> = {}): MatchProfileWithUser {
  return {
    _id: '1',
    userId: { _id: '1', username: 'user1' },
    programmingLanguage: ['Python', 'JavaScript'],
    level: 'INTERMEDIATE',
    preferences: { preferredLanguages: ['Python'], preferredLevel: 'INTERMEDIATE' },
    onboardingAnswers: {
      goals: 'learn fast build things',
      personality: 'collaborative friendly',
      projectType: 'ai ml',
    },
    isActive: true,
    age: 20,
    gender: 'FEMALE',
    location: 'NORTH AMERICA',
    biography: 'hi',
    profileImageUrl: 'test',
    createdAt: new Date(),

    ...overrides,
  };
}

describe('extractFeatures', () => {
  test('computes full feature vector', () => {
    const a = makeProfile();
    const b = makeProfile({
      programmingLanguage: ['Python', 'Go'],
      level: 'ADVANCED',
      preferences: {
        preferredLanguages: ['Python'],
        preferredLevel: 'ADVANCED',
      },
    });

    const result = extractFeatures(a, b);

    expect(result.length).toBe(6);
    expect(result[0]).toBeCloseTo(1 / 3);
    expect(result[1]).toBeCloseTo(0.5);
    expect(result[2]).toBe(1);
    expect(result[3]).toBeGreaterThan(0);
    expect(result[4]).toBeGreaterThan(0);
    expect(result[5]).toBeGreaterThan(0);
  });

  test('jaccard returns 0 when one side empty', () => {
    const a = makeProfile({ programmingLanguage: [] });
    const b = makeProfile({ programmingLanguage: ['Python'] });

    const result = extractFeatures(a, b);
    expect(result[0]).toBe(0);
  });

  test('jaccard computes correct value for overlap', () => {
    const a = makeProfile({ programmingLanguage: ['Python', 'JS'] });
    const b = makeProfile({ programmingLanguage: ['Python', 'Go'] });

    const result = extractFeatures(a, b);
    expect(result[0]).toBeCloseTo(1 / 3); // 1 intersection, 3 union
  });

  test('jaccard returns 0 when unionSize is forced to 0 (edge case)', () => {
    const a = makeProfile({ programmingLanguage: ['A'] });
    const b = makeProfile({ programmingLanguage: ['B'] });

    // Save original getter
    const original = Object.getOwnPropertyDescriptor(Set.prototype, 'size');

    // Force size = 0
    Object.defineProperty(Set.prototype, 'size', {
      get() {
        return 0;
      },
    });

    const result = extractFeatures(a, b);
    expect(result[0]).toBe(0);

    // Restore real size getter
    Object.defineProperty(Set.prototype, 'size', original!);
  });

  test('levelSimilarity returns 0.5 when one missing', () => {
    const a = makeProfile({ level: undefined as any }); // safe override
    const b = makeProfile();

    const result = extractFeatures(a, b);
    expect(result[1]).toBe(0.5);
  });

  test('levelSimilarity returns 1 when identical', () => {
    const a = makeProfile({ level: 'BEGINNER' });
    const b = makeProfile({ level: 'BEGINNER' });

    const result = extractFeatures(a, b);
    expect(result[1]).toBe(1);
  });

  test('matchPreferredLang returns 0 when no match', () => {
    const b = makeProfile({
      preferences: {
        preferredLanguages: ['Rust'],
        preferredLevel: 'ADVANCED',
      },
    });

    const result = extractFeatures(makeProfile(), b);
    expect(result[2]).toBe(0);
  });

  test('matchPreferredLang returns 0 when preferredLanguages is empty', () => {
    const a = makeProfile({ programmingLanguage: ['Python'] });
    const b = makeProfile({
      preferences: { preferredLanguages: [] as any, preferredLevel: 'BEGINNER' },
    });

    const result = extractFeatures(a, b);
    expect(result[2]).toBe(0);
  });

  test('matchPreferredLang returns 1 when a language matches preferences', () => {
    const a = makeProfile({
      programmingLanguage: ['Python', 'JavaScript'],
    });

    const b = makeProfile({
      preferences: {
        preferredLanguages: ['Python'],
        preferredLevel: 'INTERMEDIATE',
      },
    });

    const result = extractFeatures(a, b);
    expect(result[2]).toBe(1);
  });

  test('matchPreferredLang returns 0 when userALangs is undefined', () => {
    const a = makeProfile({ programmingLanguage: undefined as any });
    const b = makeProfile({
      preferences: { preferredLanguages: ['Python'], preferredLevel: 'INTERMEDIATE' },
    });

    const result = extractFeatures(a, b);
    expect(result[2]).toBe(0);
  });

  test('matchPreferredLang returns 0 when preferredLanguages is missing', () => {
    const a = makeProfile({ programmingLanguage: ['Python'] });
    const b = makeProfile({
      preferences: undefined as any, // forces fallback to []
    });

    const result = extractFeatures(a, b);
    expect(result[2]).toBe(0);
  });

  test('textSimilarity returns 0 when missing', () => {
    const a = makeProfile({
      onboardingAnswers: { goals: undefined, personality: 'x', projectType: 'x' } as any,
    });

    const result = extractFeatures(a, makeProfile());
    expect(result[3]).toBe(0);
  });

  test('textSimilarity returns 1 when identical', () => {
    const text = 'deep learning neural nets';
    const a = makeProfile({
      onboardingAnswers: {
        goals: text,
        personality: 'x',
        projectType: 'x',
      },
    });
    const b = makeProfile({
      onboardingAnswers: {
        goals: text,
        personality: 'x',
        projectType: 'x',
      },
    });

    const result = extractFeatures(a, b);
    expect(result[3]).toBe(1);
  });
});
