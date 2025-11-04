import { useState, useEffect } from 'react';
import { Question } from '../types/types';

/**
 * Custom hook to fetch question suggestions based on title and text input
 * Debounces the API calls to avoid excessive requests
 */
const useQuestionSuggestions = (title: string, text: string = '') => {
  const [suggestions, setSuggestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (title.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Set loading immediately to show we're about to search
    setLoading(true);

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (title.trim()) params.append('title', title.trim());
        if (text.trim()) params.append('text', text.trim());

        const response = await fetch(
          `http://localhost:8000/question/getQuestionsByTextAndTitle?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data: Question[] = await response.json();
        setSuggestions(data);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [title, text]);

  return { suggestions, loading };
};

export default useQuestionSuggestions;
