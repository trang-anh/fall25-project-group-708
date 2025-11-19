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
  getSessionTtl,
  getSessionUser,
} from '../services/session.service';
import { getSessionIdFromRequest } from '../utils/sessionCookie';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4530';

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

      const { sessionId } = createSession(user);

      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: getSessionTtl(),
      });

      res.redirect(`${CLIENT_URL}/home`);
    } catch (error) {
      res.status(500).json({ error: 'GitHub OAuth failed.' });
    }
  });

  router.get('/user', (req: Request, res: Response) => {
    const sessionId = getSessionIdFromRequest(req);
    const user = getSessionUser(sessionId);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    return res.status(200).json(user);
  });

  router.post('/logout', (req: Request, res: Response) => {
    const sessionId = getSessionIdFromRequest(req);
    const user = getSessionUser(sessionId);

    if (!sessionId || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    deleteSession(sessionId);

    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({ message: 'Logged out' });
  });

  return router;
};

export default authController;
