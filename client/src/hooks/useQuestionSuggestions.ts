import { useState, useEffect } from 'react';
import { PopulatedDatabaseQuestion } from '@fake-stack-overflow/shared';

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
        // Build query parameters matching backend expectations
        // Only include 'text' parameter if it has a value (backend validation rejects empty text)
        const params = new URLSearchParams();
        params.append('title', title.trim());
        if (text.trim()) {
          params.append('text', text.trim());
        }

        // Backend route: GET /api/question/getQuestionsByTextAndTitle
        const url = `/api/question/getQuestionsByTextAndTitle?${params.toString()}`;

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    // Cleanup function to cancel the timeout if user keeps typing
    return () => clearTimeout(timeoutId);
  }, [title, text]);

  return { suggestions, loading };
};

export default useQuestionSuggestions;
