import { Request } from 'express';
import jwt, { JwtPayload as LibraryJwtPayload, SignOptions } from 'jsonwebtoken';
import { SafeDatabaseUser } from '../types/types';
import { parseCookies } from '../utils/sessionCookie';

const API_TOKEN_COOKIE_NAME = 'fake_so_token';
const DEFAULT_JWT_TTL_MS = parseInt(process.env.JWT_TTL_MS || '', 10) || 1000 * 60 * 60 * 24; // 24 hours
const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret';

type JwtPayload = LibraryJwtPayload & {
  userId: string;
  username: string;
};

const getUserIdAsString = (user: SafeDatabaseUser): string =>
  typeof user._id === 'string'
    ? user._id
    : typeof user._id === 'object' && user._id !== null && 'toString' in user._id
      ? (user._id as unknown as { toString(): string }).toString()
      : '';

export const signJwt = (user: SafeDatabaseUser, ttlMs: number = DEFAULT_JWT_TTL_MS): string => {
  const expiresInSeconds = Math.floor(ttlMs / 1000);
  const payload: Omit<JwtPayload, 'exp'> = {
    userId: getUserIdAsString(user),
    username: user.username,
  };

  const options: SignOptions = { expiresIn: `${expiresInSeconds}s` };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyJwt = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
    if (typeof decoded === 'string') {
      return null;
    }

    if (!decoded.userId || !decoded.username) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

export const extractJwtFromRequest = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const cookies = parseCookies(req.headers.cookie);
  return cookies[API_TOKEN_COOKIE_NAME];
};

export const getJwtTtl = (): number => DEFAULT_JWT_TTL_MS;
export { API_TOKEN_COOKIE_NAME, JwtPayload };
