import crypto from 'crypto';
import { SafeDatabaseUser } from '../types/types';

const SESSION_COOKIE_NAME = 'fake_so_session';
const DEFAULT_SESSION_TTL_MS =
  // 1 day storage
  parseInt(process.env.SESSION_TTL_MS || '', 10) || 1000 * 60 * 60 * 24;

export type SessionMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

type SessionRecord = {
  user: SafeDatabaseUser;
  expiresAt: number;
  createdAt: number;
  lastActiveAt: number;
  metadata: SessionMetadata;
};

const sessionStore = new Map<string, SessionRecord>();

export const getUserId = (user?: SafeDatabaseUser): string | undefined => {
  if (!user || !user._id) {
    return undefined;
  }

  if (typeof user._id === 'string') {
    return user._id;
  }

  if (typeof user._id === 'object' && user._id !== null && 'toString' in user._id) {
    return (user._id as unknown as { toString(): string }).toString();
  }

  return undefined;
};

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
  metadata: SessionMetadata = {},
): { sessionId: string; expiresAt: number } => {
  pruneExpiredSessions();
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + ttlMs;
  const createdAt = Date.now();
  sessionStore.set(sessionId, {
    user,
    expiresAt,
    createdAt,
    lastActiveAt: createdAt,
    metadata,
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

  record.lastActiveAt = Date.now();
  sessionStore.set(sessionId, record);

  return record.user;
};

export const deleteSession = (sessionId: string | undefined): void => {
  if (!sessionId) {
    return;
  }

  sessionStore.delete(sessionId);
};

export const invalidateUserSessions = (user: SafeDatabaseUser | undefined): void => {
  const userId = getUserId(user);
  if (!userId) {
    return;
  }

  for (const [sessionId, record] of sessionStore.entries()) {
    if (getUserId(record.user) === userId) {
      sessionStore.delete(sessionId);
    }
  }
};

export type SessionSummary = {
  sessionId: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  metadata: SessionMetadata;
};

export const listSessionsForUser = (user: SafeDatabaseUser): SessionSummary[] => {
  const userId = getUserId(user);
  if (!userId) {
    return [];
  }

  pruneExpiredSessions();
  const sessions: SessionSummary[] = [];
  for (const [sessionId, record] of sessionStore.entries()) {
    if (getUserId(record.user) === userId) {
      sessions.push({
        sessionId,
        createdAt: record.createdAt,
        lastActiveAt: record.lastActiveAt,
        expiresAt: record.expiresAt,
        metadata: record.metadata,
      });
    }
  }

  return sessions;
};

export const deleteSessionForUser = (user: SafeDatabaseUser, sessionId: string): boolean => {
  const record = sessionStore.get(sessionId);
  if (!record) {
    return false;
  }

  if (getUserId(record.user) !== getUserId(user)) {
    return false;
  }

  sessionStore.delete(sessionId);
  return true;
};

export const getSessionTtl = (): number => DEFAULT_SESSION_TTL_MS;

export { SESSION_COOKIE_NAME };
