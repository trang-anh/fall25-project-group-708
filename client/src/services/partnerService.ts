const REACT_APP_SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000';

/**
 * Fetches potential partner matches based on shared skills
 * @param username - Current user's username
 * @returns Promise with partners data
 */
export const getPartnerMatches = async (username: string) => {
  const response = await fetch(`${REACT_APP_SERVER_URL}/api/partner/getPotentialPartners/${username}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch partner matches');
  }

  return response.json();
};

/**
 * Sends a connection request to another user
 * @param fromUsername - Current user's username
 * @param toUsername - Target user's username
 * @returns Promise with connection result
 */
export const sendConnectionRequest = async (fromUsername: string, toUsername: string) => {
  const response = await fetch(`${REACT_APP_SERVER_URL}/api/partner/sendConnectionRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ fromUsername, toUsername }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send connection request');
  }

  return response.json();
};

/**
 * Fetches connection requests for a user
 * @param username - User's username
 * @returns Promise with connection requests data
 */
export const getConnectionRequests = async (username: string) => {
  const response = await fetch(`${REACT_APP_SERVER_URL}/api/partner/getConnectionRequests/${username}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch connection requests');
  }

  return response.json();
};