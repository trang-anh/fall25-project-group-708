/**
 * Basic structure for all the onboarding form data.
 * This is everything the user fills out during the setup steps
 * before we convert it into a real MatchProfile for the backend.
 *
 * Fields:
 * - age, gender, location - basic user info
 * - programmingLanguage - languages they know (as strings)
 * - level - their skill level
 * - preferences - what they want in a partner
 * - onboardingAnswers - free-text answers about goals, style, and project interests
 * - biography - short intro about themselves
 */
export interface OnboardingFormData {
  age: number;
  gender: string;
  location: string;
  programmingLanguage: string[];
  level: string;
  preferences: {
    preferredLanguages: string[];
    preferredLevel: string;
  };
  onboardingAnswers: {
    goals: string;
    personality: string;
    projectType: string;
  };
  biography: string;
}
