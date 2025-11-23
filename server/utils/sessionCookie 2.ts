import { Request } from 'express';
import { SESSION_COOKIE_NAME } from '../services/session.service';

export const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, rawCookie) => {
    const [name, ...valueParts] = rawCookie.trim().split('=');
    if (!name) {
      return acc;
    }

    acc[name] = decodeURIComponent(valueParts.join('='));
    return acc;
  }, {});
};

export const getSessionIdFromRequest = (req: Request): string | undefined => {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME];
};
