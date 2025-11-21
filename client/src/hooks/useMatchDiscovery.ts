import { DatabaseMatchProfile } from '@fake-stack-overflow/shared';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  getAllMatchProfiles,
  getMatchProfile,
  calculateCompatibilityScore,
} from '../services/matchProfileService';
import { MatchProfileWithScore, useUserMatches } from './useMatchProfilePage';

const useMatchDiscovery = (currentUserId: string | null) => {
  const [profiles, setProfiles] = useState<MatchProfileWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { matches } = useUserMatches(currentUserId);

  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentUserProfile, setCurrentUserProfile] = useState<DatabaseMatchProfile | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allProfiles = await getAllMatchProfiles();

      // exclude current user + inactive profiles
      const activeProfiles = allProfiles.filter(
        (p: DatabaseMatchProfile) => p.userId.toString() !== currentUserId && p.isActive,
      );

      // fetch current user's profile for compatibility score
      const userProfile = currentUserId ? await getMatchProfile(currentUserId) : null;

      setCurrentUserProfile(userProfile);

      const result: MatchProfileWithScore[] = activeProfiles.map(p => ({
        ...p,
        compatibilityScore: currentUserProfile
          ? calculateCompatibilityScore(currentUserProfile, p)
          : 0,
      }));

      // Sort by compatibility score
      result.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      setProfiles(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // IDs already matched
  const matchedUserIds = useMemo(
    () => new Set(matches.flatMap(m => [m.userA.toString(), m.userB.toString()])),
    [matches],
  );

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const id = p.userId.toString();

      // exclude matched people
      if (matchedUserIds.has(id)) return false;

      // filter by level
      if (selectedLevel !== 'ALL' && p.level !== selectedLevel) return false;

      // filter by language
      if (!p.programmingLanguage.some(lang => lang.name === selectedLanguage)) {
        return false;
      }

      // search by bio or location
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const bio = p.biography?.toLowerCase() ?? '';
        const loc = p.location?.toLowerCase() ?? '';
        if (!bio.includes(q) && !loc.includes(q)) return false;
      }

      return true;
    });
  }, [profiles, selectedLevel, selectedLanguage, searchQuery, matchedUserIds]);

  return {
    profiles,
    filteredProfiles,
    selectedLevel,
    selectedLanguage,
    searchQuery,
    setSelectedLevel,
    setSelectedLanguage,
    setSearchQuery,
    currentUserProfile,
    loading,
    error,
    refetch: fetchProfiles,
  };
};

export default useMatchDiscovery;
