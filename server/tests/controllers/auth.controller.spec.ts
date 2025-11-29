import request from 'supertest';
import express from 'express';
import authController from '../../controllers/auth.controller';

import {
  buildGithubAuthorizeUrl,
  exchangeCodeForToken,
  fetchGithubUser,
  findOrCreateGithubUser,
} from '../../services/auth.service';

import {
  createSession,
  deleteSession,
  deleteSessionForUser,
  getSessionTtl,
  getSessionUser,
  invalidateUserSessions,
  listSessionsForUser,
} from '../../services/session.service';

import { extractJwtFromRequest, getJwtTtl, signJwt, verifyJwt } from '../../services/jwt.service';

import { getSessionIdFromRequest } from '../../utils/sessionCookie';

import UserModel from '../../models/users.model';

type Mock = jest.MockedFunction<any>;
jest.mock('../../services/auth.service', () => ({
  buildGithubAuthorizeUrl: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  fetchGithubUser: jest.fn(),
  findOrCreateGithubUser: jest.fn(),
}));

jest.mock('../../services/session.service', () => ({
  SESSION_COOKIE_NAME: 'SESSIONID',
  createSession: jest.fn(),
  deleteSession: jest.fn(),
  deleteSessionForUser: jest.fn(),
  getSessionTtl: jest.fn(),
  getSessionUser: jest.fn(),
  invalidateUserSessions: jest.fn(),
  listSessionsForUser: jest.fn(),
}));

jest.mock('../../services/jwt.service', () => ({
  API_TOKEN_COOKIE_NAME: 'APITOKEN',
  extractJwtFromRequest: jest.fn(),
  getJwtTtl: jest.fn(),
  signJwt: jest.fn(),
  verifyJwt: jest.fn(),
}));

jest.mock('../../utils/sessionCookie', () => ({
  getSessionIdFromRequest: jest.fn(),
}));

jest.mock('../../models/users.model', () => ({
  findById: jest.fn(),
}));

// Helper constants
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4530';
const sampleUser = {
  _id: 'user1',
  username: 'testuser',
  dateJoined: Date.now(),
  biography: 'bio',
  githubId: 'gh1',
  totalPoints: 10,
};

describe('auth.controller', () => {
  let app: express.Express;

  beforeEach(() => {
    // clean all mock state
    jest.resetAllMocks();

    app = express();
    app.use(express.json());
    app.use('/', authController());

    (buildGithubAuthorizeUrl as Mock).mockReturnValue('https://github.com/oauth');
    (getSessionTtl as Mock).mockReturnValue(1000 * 60 * 60); // 1 hour
    (getJwtTtl as Mock).mockReturnValue(1000 * 60 * 10); // 10 minutes
    (createSession as Mock).mockReturnValue({ sessionId: 'sess-1' });
    (signJwt as Mock).mockReturnValue('signed-jwt-token');
    (verifyJwt as Mock).mockImplementation((token: string) => ({ userId: 'user1' }));
    (UserModel.findById as any).mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(sampleUser),
    }));
  });

  it('GET /github should redirect to GitHub authorize url', async () => {
    const res = await request(app).get('/github');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('https://github.com/oauth');
    expect(buildGithubAuthorizeUrl).toHaveBeenCalled();
  });

  it('GET /github should return 500 when buildGithubAuthorizeUrl throws', async () => {
    (buildGithubAuthorizeUrl as Mock).mockImplementation(() => {
      throw new Error('fail');
    });

    const res = await request(app).get('/github');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to start GitHub OAuth flow.' });
  });

  it('GET /github/callback should 400 when no code provided', async () => {
    const res = await request(app).get('/github/callback');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing OAuth code from GitHub.' });
  });

  it('GET /github/callback returns 500 if exchangeCodeForToken throws', async () => {
    (exchangeCodeForToken as Mock).mockRejectedValue(new Error('network'));
    const res = await request(app).get('/github/callback').query({ code: 'abc' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'GitHub OAuth failed.' });
  });

  it('GET /github/callback returns 500 when findOrCreateGithubUser returns error', async () => {
    (exchangeCodeForToken as Mock).mockResolvedValue('token123');
    (fetchGithubUser as Mock).mockResolvedValue({ id: 'gh' });
    (findOrCreateGithubUser as Mock).mockResolvedValue({ error: 'db error' });

    const res = await request(app).get('/github/callback').query({ code: 'abc' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'db error' });
  });

  it('GET /github/callback success path sets cookies and redirects to client', async () => {
    (exchangeCodeForToken as Mock).mockResolvedValue('token123');
    (fetchGithubUser as Mock).mockResolvedValue({ id: 'gh' });
    (findOrCreateGithubUser as Mock).mockResolvedValue({
      ...sampleUser,
      githubId: 'gh1',
      username: 'testuser',
    });

    const res = await request(app).get('/github/callback').query({ code: 'abc' });
    // On success controller calls res.redirect(...)
    expect(res.status).toBe(302);
    expect(res.header.location).toContain(`${CLIENT_URL}/home?`);
    // cookies should be set
    const setCookies = res.header['set-cookie'];
    expect(setCookies).toBeDefined();
    const raw = res.headers['set-cookie'];
    const setCookies2 = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const joined = setCookies2.join(';');

    expect(joined).toContain('SESSIONID=');
    expect(joined).toContain('APITOKEN=');
    expect(invalidateUserSessions).toHaveBeenCalled();
    expect(createSession).toHaveBeenCalled();
    expect(signJwt).toHaveBeenCalled();
  });

  it('GET /user returns authenticated:true when valid JWT present', async () => {
    // simulate jwt present
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBe('jwt-token');
  });

  it('GET /user returns authenticated:true and sets cookie when session exists but no jwt', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue(undefined);
    (getSessionIdFromRequest as Mock).mockReturnValue('sess-1');
    (getSessionUser as Mock).mockReturnValue(sampleUser);

    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.user).toEqual(sampleUser);

    // cookie set for API token
    const setCookies3 = res.header['set-cookie'];
    expect(setCookies3).toBeDefined();
    const raw = res.headers['set-cookie'];
    const setCookies4 = Array.isArray(raw) ? raw : raw ? [raw] : [];
    expect(setCookies4.join(';')).toContain('APITOKEN=');
  });

  it('GET /user returns authenticated:false when neither jwt nor session exist', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue(undefined);
    (getSessionIdFromRequest as Mock).mockReturnValue(undefined);
    (getSessionUser as Mock).mockReturnValue(undefined);

    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ authenticated: false });
  });

  it('POST /logout returns 401 when not authenticated', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue(undefined);
    (getSessionIdFromRequest as Mock).mockReturnValue(undefined);
    (getSessionUser as Mock).mockReturnValue(undefined);
    // resolveUserFromJwt will return undefined because no token
    const res = await request(app).post('/logout');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Not authenticated' });
  });

  it('POST /logout logs out when session user exists', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue(undefined);
    (getSessionIdFromRequest as Mock).mockReturnValue('sess-1');
    (getSessionUser as Mock).mockReturnValue(sampleUser);
    (deleteSession as Mock).mockImplementation(() => {});

    const res = await request(app).post('/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Logged out' });
    expect(deleteSession).toHaveBeenCalledWith('sess-1');
  });

  it('POST /logout logs out when jwt user exists', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    // make verifyJwt return payload and findById to return user
    (getSessionIdFromRequest as Mock).mockReturnValue(undefined);
    (getSessionUser as Mock).mockReturnValue(undefined);

    const res = await request(app).post('/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Logged out' });
    // deleteSession called with undefined session id
    expect(deleteSession).toHaveBeenCalled();
  });

  it('GET /sessions returns 401 when not authenticated', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue(undefined);
    (getSessionIdFromRequest as Mock).mockReturnValue(undefined);
    (getSessionUser as Mock).mockReturnValue(undefined);

    const res = await request(app).get('/sessions');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Not authenticated' });
  });

  it('GET /sessions returns list when authenticated via jwt', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    const sessions = [
      {
        sessionId: 'sess-1',
        createdAt: 1000,
        lastActiveAt: 1001,
        expiresAt: 2000,
        metadata: { ipAddress: '1.2.3.4', userAgent: 'ua' },
      },
      {
        sessionId: 'sess-2',
        createdAt: 500,
        lastActiveAt: 600,
        expiresAt: 1600,
        metadata: { ipAddress: '1.2.3.5', userAgent: 'ua2' },
      },
    ];
    (listSessionsForUser as Mock).mockReturnValue(sessions);

    const res = await request(app).get('/sessions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(Array.isArray(res.body.recentLogins)).toBe(true);
    expect(res.body.sessions[0]).toHaveProperty('sessionId', 'sess-1');
  });

  it('DELETE /sessions/:sessionId returns 401 when not authenticated', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue(undefined);
    (getSessionIdFromRequest as Mock).mockReturnValue(undefined);
    (getSessionUser as Mock).mockReturnValue(undefined);

    const res = await request(app).delete('/sessions/abc');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Not authenticated' });
  });

  it('DELETE /sessions/:sessionId returns 404 when session not found', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    (getSessionIdFromRequest as Mock).mockReturnValue('current-sess');
    // resolved user via jwt
    (deleteSessionForUser as Mock).mockReturnValue(false);

    const res = await request(app).delete('/sessions/target-sess');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Session not found' });
  });

  it('DELETE /sessions/:sessionId success and revokes current session', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    (getSessionIdFromRequest as Mock).mockReturnValue('target-sess');
    (deleteSessionForUser as Mock).mockReturnValue(true);

    const res = await request(app).delete('/sessions/target-sess');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Session revoked');
    expect(res.body).toHaveProperty('currentSessionRevoked', true);
  });

  it('DELETE /sessions/:sessionId success when revoking other session', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    (getSessionIdFromRequest as Mock).mockReturnValue('current-sess');
    (deleteSessionForUser as Mock).mockReturnValue(true);

    const res = await request(app).delete('/sessions/target-sess');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Session revoked');
    expect(res.body).toHaveProperty('currentSessionRevoked', false);
  });

  it('GET /github/callback returns 500 when findOrCreateGithubUser returns null', async () => {
    (exchangeCodeForToken as Mock).mockResolvedValue('token123');
    (fetchGithubUser as Mock).mockResolvedValue({ id: 'gh' });
    (findOrCreateGithubUser as Mock).mockResolvedValue(null);

    const res = await request(app).get('/github/callback').query({ code: 'abc' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'GitHub OAuth failed.' });
  });

  it('GET /user returns authenticated:false if JWT user not found in DB', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    (UserModel.findById as any).mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(null),
    }));

    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  it('POST /logout handles deleteSession throwing', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue(undefined);
    (getSessionIdFromRequest as Mock).mockReturnValue('sess-1');
    (getSessionUser as Mock).mockReturnValue(sampleUser);
    (deleteSession as Mock).mockImplementation(() => {});

    const res = await request(app).post('/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Logged out' });
  });

  it('DELETE /sessions/:sessionId returns 404 if deleteSessionForUser throws', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    (deleteSessionForUser as Mock).mockImplementation(() => {
      throw new Error('fail');
    });

    const res = await request(app).delete('/sessions/any-sess');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to revoke session.' });
  });

  it('GET /user returns authenticated:false if JWT payload has no userId', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    (verifyJwt as Mock).mockReturnValue({});
    const res = await request(app).get('/user');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ authenticated: false });
  });

  it('GET /user returns authenticated:false if verifyJwt throws', async () => {
    (extractJwtFromRequest as Mock).mockReturnValue('jwt-token');
    (verifyJwt as Mock).mockImplementation(() => {
      throw new Error('fail');
    });

    const res = await request(app).get('/user');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ authenticated: false });
  });
});
