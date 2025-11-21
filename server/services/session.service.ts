import crypto from 'crypto';
import { SafeDatabaseUser } from '../types/types';

const SESSION_COOKIE_NAME = 'fake_so_session';
const DEFAULT_SESSION_TTL_MS =
  // 1 day storage
  parseInt(process.env.SESSION_TTL_MS || '', 10) || 1000 * 60 * 60 * 24;

type SessionRecord = {
  user: SafeDatabaseUser;
  expiresAt: number;
};

const sessionStore = new Map<string, SessionRecord>();

const pruneExpiredSessions = () => {
  const now = Date.now();

  for (const [sessionId, record] of sessionStore.entries()) {
    if (record.expiresAt <= now) {
      sessionStore.delete(sessionId);
    }
  }
};

export const createSession = (
  user: SafeDatabaseUser,
  ttlMs: number = DEFAULT_SESSION_TTL_MS,
): { sessionId: string; expiresAt: number } => {
  pruneExpiredSessions();
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + ttlMs;
  sessionStore.set(sessionId, {
    user,
    expiresAt,
  });

  return { sessionId, expiresAt };
};

export const getSessionUser = (sessionId: string | undefined): SafeDatabaseUser | undefined => {
  if (!sessionId) {
    return undefined;
  }

  const record = sessionStore.get(sessionId);
  if (!record) {
    return undefined;
  }

  if (record.expiresAt <= Date.now()) {
    sessionStore.delete(sessionId);
    return undefined;
  }

  return record.user;
};

export const deleteSession = (sessionId: string | undefined): void => {
  if (!sessionId) {
    return;
  }

  sessionStore.delete(sessionId);
};

export const getSessionTtl = (): number => DEFAULT_SESSION_TTL_MS;

export { SESSION_COOKIE_NAME };
