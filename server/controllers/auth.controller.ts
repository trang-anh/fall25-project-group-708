import express, { Request, Response, Router } from 'express';
import {
  buildGithubAuthorizeUrl,
  exchangeCodeForToken,
  fetchGithubUser,
  findOrCreateGithubUser,
} from '../services/auth.service';
import {
  SESSION_COOKIE_NAME,
  createSession,
  deleteSession,
  deleteSessionForUser,
  getSessionTtl,
  getSessionUser,
  invalidateUserSessions,
  listSessionsForUser,
} from '../services/session.service';
import { getSessionIdFromRequest } from '../utils/sessionCookie';
import {
  API_TOKEN_COOKIE_NAME,
  extractJwtFromRequest,
  getJwtTtl,
  signJwt,
  verifyJwt,
} from '../services/jwt.service';
import UserModel from '../models/users.model';
import { DatabaseUser, SafeDatabaseUser } from '../types/types';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4530';
const RECENT_LOGIN_LIMIT = 5;
const toSafeUser = (user: DatabaseUser): SafeDatabaseUser => ({
  _id: user._id,
  username: user.username,
  dateJoined: user.dateJoined,
  biography: user.biography,
  githubId: user.githubId,
  totalPoints: user.totalPoints,
});

const resolveUserFromJwt = async (
  token: string | undefined,
): Promise<SafeDatabaseUser | undefined> => {
  if (!token) {
    return undefined;
  }

  try {
    const payload = verifyJwt(token);
    if (!payload?.userId) {
      return undefined;
    }

    const dbUser = await UserModel.findById(payload.userId).select('-password');
    if (!dbUser) {
      return undefined;
    }

    return toSafeUser(dbUser as DatabaseUser);
  } catch {
    return undefined;
  }
};

const authController = (): Router => {
  const router = express.Router();

  // Step 1: Redirect user to GitHub OAuth
  router.get('/github', (_req: Request, res: Response) => {
    try {
      const authUrl = buildGithubAuthorizeUrl('');
      res.redirect(authUrl);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start GitHub OAuth flow.' });
    }
  });

  // Step 2: Handle GitHub callback and create/find user in DB
  router.get('/github/callback', async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string | undefined;

      if (!code) {
        return res.status(400).json({ error: 'Missing OAuth code from GitHub.' });
      }

      // Exchange code for access token
      const accessToken = await exchangeCodeForToken(code);

      // Fetch GitHub user info
      const ghUser = await fetchGithubUser(accessToken);

      // Find or create MongoDB user
      const user = await findOrCreateGithubUser(ghUser);

      if ('error' in user) {
        return res.status(500).json({ error: user.error });
      }

      invalidateUserSessions(user);

      const { sessionId } = createSession(user, getSessionTtl(), {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: getSessionTtl(),
      });

      const apiToken = signJwt(user, getJwtTtl());
      res.cookie(API_TOKEN_COOKIE_NAME, apiToken, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: getJwtTtl(),
      });

      const queryParams = new URLSearchParams({
        username: user.username,
        githubId: user.githubId || '',
        token: apiToken,
      });

      res.redirect(`${CLIENT_URL}/home?${queryParams.toString()}`);
    } catch (error) {
      res.status(500).json({ error: 'GitHub OAuth failed.' });
    }
  });

  router.get('/user', async (req: Request, res: Response) => {
    const tokenFromRequest = extractJwtFromRequest(req);
    const userFromToken = await resolveUserFromJwt(tokenFromRequest);

    if (userFromToken) {
      return res.status(200).json({
        authenticated: true,
        user: userFromToken,
        token: tokenFromRequest,
      });
    }

    const sessionId = getSessionIdFromRequest(req);
    const user = getSessionUser(sessionId);

    if (!user) {
      return res.status(200).json({ authenticated: false });
    }

    const apiToken = signJwt(user, getJwtTtl());
    res.cookie(API_TOKEN_COOKIE_NAME, apiToken, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({ authenticated: true, user, token: apiToken });
  });

  router.post('/logout', async (req: Request, res: Response) => {
    const token = extractJwtFromRequest(req);
    const sessionId = getSessionIdFromRequest(req);
    const sessionUser = getSessionUser(sessionId);
    const jwtUser = await resolveUserFromJwt(token);

    if (!sessionUser && !jwtUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    deleteSession(sessionId);

    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.clearCookie(API_TOKEN_COOKIE_NAME, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({ message: 'Logged out' });
  });

  router.get('/sessions', async (req: Request, res: Response) => {
    const token = extractJwtFromRequest(req);
    const sessionId = getSessionIdFromRequest(req);
    const jwtUser = await resolveUserFromJwt(token);
    const user = jwtUser ?? getSessionUser(sessionId);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const summaries = listSessionsForUser(user)
      .map(session => ({
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        expiresAt: session.expiresAt,
        ipAddress: session.metadata.ipAddress,
        userAgent: session.metadata.userAgent,
        current: session.sessionId === sessionId,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({
      sessions: summaries,
      recentLogins: summaries.slice(0, RECENT_LOGIN_LIMIT),
    });
  });

  router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
    const token = extractJwtFromRequest(req);
    const currentSessionId = getSessionIdFromRequest(req);
    const jwtUser = await resolveUserFromJwt(token);
    const user = jwtUser ?? getSessionUser(currentSessionId);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const targetSessionId = req.params.sessionId;
    const deleted = deleteSessionForUser(user, targetSessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const currentSessionRevoked = targetSessionId === currentSessionId;

    if (currentSessionRevoked) {
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      res.clearCookie(API_TOKEN_COOKIE_NAME, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return res.status(200).json({
      message: 'Session revoked',
      currentSessionRevoked,
    });
  });

  return router;
};

export default authController;
