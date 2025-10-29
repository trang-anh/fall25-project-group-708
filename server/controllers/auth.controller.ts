import express from 'express';
import {
  buildGithubAuthorizeUrl,
  exchangeCodeForToken,
  fetchGithubUser,
  findOrCreateGithubUser,
} from '../services/auth.service';

const authController = () => {
  const router = express.Router();

  // Step 1: Redirect user to GitHub OAuth
  router.get('/github', (req, res) => {
    try {
      const authUrl = buildGithubAuthorizeUrl('');
      res.redirect(authUrl);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start GitHub OAuth flow.' });
    }
  });

  // Step 2: Handle GitHub callback and create/find user in DB
  router.get('/github/callback', async (req, res) => {
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

      // Redirect to frontend home with query params
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:4530'}/home?username=${encodeURIComponent(
        user.username,
      )}&githubId=${encodeURIComponent(user.githubId || '')}`;

      res.redirect(redirectUrl);
    } catch (error) {
      res.status(500).json({ error: 'GitHub OAuth failed.' });
    }
  });

  return router;
};

export default authController;
