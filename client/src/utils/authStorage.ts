import { SafeDatabaseUser } from '../types/types';

const REMEMBERED_USER_KEY = 'rememberedUser';

const safeParse = (value: string | null): SafeDatabaseUser | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as SafeDatabaseUser;
  } catch {
    return null;
  }
};

export const loadRememberedUser = (): SafeDatabaseUser | null => {
  if (typeof window === 'undefined') return null;
  return safeParse(localStorage.getItem(REMEMBERED_USER_KEY));
};

export const saveRememberedUser = (user: SafeDatabaseUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMEMBERED_USER_KEY, JSON.stringify(user));
};

export const clearRememberedUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMEMBERED_USER_KEY);
};

export const rememberedUserMatches = (username: string): boolean => {
  const remembered = loadRememberedUser();
  return remembered?.username === username;
};

export { REMEMBERED_USER_KEY };
