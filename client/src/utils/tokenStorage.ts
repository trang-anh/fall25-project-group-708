const TOKEN_STORAGE_KEY = 'fake_so_api_token';
const TOKEN_COOKIE_NAME = 'fake_so_token';

const IS_BROWSER = typeof window !== 'undefined';

// Read token from cookies
const readTokenFromCookie = (): string | null => {
  if (!IS_BROWSER || !document.cookie) return null;

  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  const tokenCookie = cookies.find(cookie => cookie.startsWith(`${TOKEN_COOKIE_NAME}=`));
  if (!tokenCookie) return null;

  const [, value] = tokenCookie.split('=');
  return value ? decodeURIComponent(value) : null;
};

// Store token in localStorage or sessionStorage
export const storeAuthToken = (token: string, persist = true): void => {
  if (!IS_BROWSER || !token) return;
  const storage = persist ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_STORAGE_KEY, token);
};

// Load token from storage or cookies
export const loadAuthToken = (): string | null => {
  if (!IS_BROWSER) return null;

  return (
    window.localStorage.getItem(TOKEN_STORAGE_KEY) ||
    window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
    readTokenFromCookie()
  );
};

// Clear token from all storage locations
export const clearAuthToken = (): void => {
  if (!IS_BROWSER) return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export { TOKEN_STORAGE_KEY };
