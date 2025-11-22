import useMatchRecommendation from './useMatchRecommendation';
import { useState, useMemo } from 'react';
import { useUserMatches } from './useMatchProfilePage';
import { RecommendationProfile } from '../types/recommendationProfile';

const useMatchDiscovery = (currentUserId: string | null) => {
  const { recommended, loading, error, refetch } = useMatchRecommendation(currentUserId);
  const { matches } = useUserMatches(currentUserId);

  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // users already matched
  const matchedUserIds = useMemo(
    () => new Set(matches.flatMap(m => [m.userA.toString(), m.userB.toString()])),
    [matches],
  );

  // eslint-disable-next-line no-console
  console.log('RECOMMENDED RAW:', recommended);

  const filteredProfiles = useMemo(() => {
    return recommended.filter((p: RecommendationProfile) => {
      const id = p.userId._id.toString();

      if (matchedUserIds.has(id)) return false;

      if (selectedLevel !== 'ALL' && p.level !== selectedLevel) return false;

      if (selectedLanguage !== 'ALL') {
        if (!p.programmingLanguage.includes(selectedLanguage)) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        if (!(p.biography?.toLowerCase() ?? '').includes(q)) return false;
      }

      return true;
    });
  }, [recommended, selectedLevel, selectedLanguage, searchQuery, matchedUserIds]);

  return {
    profiles: recommended,
    filteredProfiles,
    selectedLevel,
    selectedLanguage,
    searchQuery,
    setSelectedLevel,
    setSelectedLanguage,
    setSearchQuery,
    loading,
    error,
    refetch,
  };
};

export default useMatchDiscovery;
