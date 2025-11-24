export interface RecommendationUser {
  _id: string;
  username: string;
}

export interface RecommendationProfile {
  _id: string;
  userId: RecommendationUser;

  programmingLanguage: string[];
  level: string;

  biography?: string;
  profileImageUrl?: string;

  compatibilityScore: number;
}
