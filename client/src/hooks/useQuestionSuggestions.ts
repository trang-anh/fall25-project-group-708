import { useState, useEffect } from 'react';
import { PopulatedDatabaseQuestion } from '@fake-stack-overflow/shared';
import { getSuggestedQuestions } from '../services/questionService';

/**
 * Custom hook to fetch question suggestions based on title and text input
 * Debounces the API calls to avoid excessive requests
 */
const useQuestionSuggestions = (title: string, text: string = '') => {
  const [suggestions, setSuggestions] = useState<PopulatedDatabaseQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only search if title is at least 3 characters
    if (title.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Set loading immediately to show we're about to search
    setLoading(true);

    // Debounce the API call - wait 500ms after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        const data = await getSuggestedQuestions(title, text);
        setSuggestions(data);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    // Cleanup function to cancel the timeout if user keeps typing
    return () => clearTimeout(timeoutId);
  }, [title, text]);

  return { suggestions, loading };
};

export default useQuestionSuggestions;
