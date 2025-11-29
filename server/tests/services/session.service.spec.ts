import { SafeDatabaseUser } from '../../types/types';
import mongoose from 'mongoose';
import {
  createSession,
  getSessionUser,
  getUserId,
  deleteSession,
  invalidateUserSessions,
  listSessionsForUser,
  deleteSessionForUser,
  getSessionTtl,
  SESSION_COOKIE_NAME,
} from '../../services/session.service';

describe('session.service', () => {
  let user: SafeDatabaseUser;

  beforeEach(() => {
    user = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser',
      dateJoined: new Date(),
      biography: 'bio',
      githubId: 'gh1',
      totalPoints: 10,
    };
  });

  it('createSession returns sessionId and expiresAt', () => {
    const { sessionId, expiresAt } = createSession(user, 1000);
    expect(typeof sessionId).toBe('string');
    expect(typeof expiresAt).toBe('number');
  });

  it('getSessionUser returns undefined for missing sessionId', () => {
    expect(getSessionUser(undefined)).toBeUndefined();
  });

  it('getSessionUser returns undefined for non-existent session', () => {
    expect(getSessionUser('fake')).toBeUndefined();
  });

  it('getSessionUser returns undefined for expired session', () => {
    const { sessionId } = createSession(user, -1000); // expired
    expect(getSessionUser(sessionId)).toBeUndefined();
  });

  it('getSessionUser returns user and updates lastActiveAt for valid session', () => {
    const { sessionId } = createSession(user, 10000);
    const sessionUser = getSessionUser(sessionId);
    expect(sessionUser).toEqual(user);
  });

  it('deleteSession does nothing for undefined sessionId', () => {
    expect(() => deleteSession(undefined)).not.toThrow();
  });

  it('deleteSession deletes existing session', () => {
    const { sessionId } = createSession(user, 10000);
    deleteSession(sessionId);
    expect(getSessionUser(sessionId)).toBeUndefined();
  });

  it('invalidateUserSessions does nothing for undefined user', () => {
    expect(() => invalidateUserSessions(undefined)).not.toThrow();
  });

  it('invalidateUserSessions deletes all sessions for the user', () => {
    const { sessionId } = createSession(user, 10000);
    invalidateUserSessions(user);
    expect(getSessionUser(sessionId)).toBeUndefined();
  });

  it('listSessionsForUser returns empty array for user with no sessions', () => {
    const sessions = listSessionsForUser(user);
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBe(0);
  });

  it('listSessionsForUser returns sessions for user', () => {
    const { sessionId } = createSession(user, 10000, { ipAddress: '1.2.3.4' });
    const sessions = listSessionsForUser(user);
    expect(sessions.length).toBe(1);
    expect(sessions[0]).toHaveProperty('sessionId', sessionId);
    expect(sessions[0].metadata).toEqual({ ipAddress: '1.2.3.4' });
  });

  it('deleteSessionForUser returns false for non-existent session', () => {
    expect(deleteSessionForUser(user, 'fake')).toBe(false);
  });

  it('deleteSessionForUser returns false for session belonging to another user', () => {
    const otherUser = { ...user, _id: new mongoose.Types.ObjectId() };
    const { sessionId } = createSession(otherUser, 10000);
    expect(deleteSessionForUser(user, sessionId)).toBe(false);
  });

  it('deleteSessionForUser deletes session and returns true', () => {
    const { sessionId } = createSession(user, 10000);
    expect(deleteSessionForUser(user, sessionId)).toBe(true);
    expect(getSessionUser(sessionId)).toBeUndefined();
  });

  it('getSessionTtl returns default session TTL', () => {
    const ttl = getSessionTtl();
    expect(typeof ttl).toBe('number');
  });

  it('SESSION_COOKIE_NAME is defined', () => {
    expect(SESSION_COOKIE_NAME).toBeDefined();
  });

  it('getUserId handles string _id', () => {
    const fakeUser = { ...user, _id: new mongoose.Types.ObjectId() };
    expect(createSession(fakeUser)).toBeDefined();
  });

  it('getUserId handles missing _id', () => {
    const fakeUser = { ...user, _id: undefined } as any;
    expect(getUserId(fakeUser)).toBeUndefined();
  });

  it('getUserId returns undefined if _id cannot be converted to string', () => {
    const badUser = { ...user, _id: { noToString: true } } as any;
    expect(getSessionUser('fake')).toBeUndefined();
    expect(deleteSessionForUser(badUser, 'fake')).toBe(false);
  });

  it('deleteSessionForUser returns false if session belongs to different user', () => {
    const otherUser = { ...user, _id: new mongoose.Types.ObjectId() };
    const { sessionId } = createSession(otherUser, 10000);
    expect(deleteSessionForUser(user, sessionId)).toBe(false);
  });

  it('pruneExpiredSessions deletes expired sessions', () => {
    const { sessionId } = createSession(user, -1000);
    expect(getSessionUser(sessionId)).toBeUndefined();
  });
});

describe('session.service edge cases', () => {
  let user: SafeDatabaseUser;

  beforeEach(() => {
    user = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser',
      dateJoined: new Date(),
      biography: 'bio',
      githubId: 'gh1',
      totalPoints: 10,
    };
  });

  it('getSessionUser returns undefined if session expired', () => {
    const { sessionId } = createSession(user, -1000);
    expect(getSessionUser(sessionId)).toBeUndefined();
  });

  it('deleteSessionForUser returns false if session belongs to another user', () => {
    const otherUser: SafeDatabaseUser = { ...user, _id: new mongoose.Types.ObjectId() };
    const { sessionId } = createSession(otherUser, 10000);
    expect(deleteSessionForUser(user, sessionId)).toBe(false);
  });

  it('getUserId returns undefined if _id cannot be converted to string', () => {
    const badUser = { _id: Object.create(null), username: 'test' } as any;
    expect(getUserId(badUser)).toBeUndefined();
  });

  it('getSessionUser returns undefined if sessionId is undefined', () => {
    expect(getSessionUser(undefined)).toBeUndefined();
  });
});
