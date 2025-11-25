import UserModel from '../models/users.model';
import { SafeDatabaseUser, UserResponse } from '../types/types';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const DEFAULT_GITHUB_REDIRECT_URI =
  process.env.OAUTH_REDIRECT_URI ||
  'https://cs4530-f25-708-dosr.onrender.com/api/auth/github/callback';

type GithubAccessTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GithubUserProfile = {
  id: number;
  login: string;
  name?: string | null;
  bio?: string | null;
};

// Ensure required GitHub OAuth config exists
const ensureGithubConfig = () => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.OAUTH_REDIRECT_URI || DEFAULT_GITHUB_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth is not configured properly.');
  }

  return { clientId, clientSecret, redirectUri };
};

// Step 1: Build GitHub authorization URL
export const buildGithubAuthorizeUrl = (state: string): string => {
  const { clientId, redirectUri } = ensureGithubConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
    allow_signup: 'true',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

// Step 2: Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string): Promise<string> => {
  const { clientId, clientSecret, redirectUri } = ensureGithubConfig();

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange GitHub auth code. Status: ${response.status}`);
  }

  const tokenPayload = (await response.json()) as GithubAccessTokenResponse;

  if (!tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description || 'Missing access token in GitHub response');
  }

  return tokenPayload.access_token;
};

// Step 3: Fetch GitHub user profile using the access token
export const fetchGithubUser = async (accessToken: string): Promise<GithubUserProfile> => {
  const response = await fetch(GITHUB_USER_URL, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'fake-stack-overflow-app',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub user profile. Status: ${response.status}`);
  }

  const profile = (await response.json()) as GithubUserProfile;

  if (!profile || !profile.id || !profile.login) {
    throw new Error('GitHub user profile is missing required fields.');
  }

  return profile;
};

// Step 4: Find or create user in MongoDB
export const findOrCreateGithubUser = async (profile: GithubUserProfile): Promise<UserResponse> => {
  try {
    const githubId = profile.id.toString();
    let user = await UserModel.findOne({ githubId }).select('-password');

    if (!user) {
      user = await UserModel.create({
        username: profile.login,
        password: '',
        dateJoined: new Date(),
        biography: profile.bio || '',
        githubId,
      });
    }

    const safeUser: SafeDatabaseUser = {
      _id: user._id,
      username: user.username,
      dateJoined: user.dateJoined,
      biography: user.biography,
      githubId: user.githubId,
      totalPoints: user.totalPoints,
    };

    return safeUser;
  } catch (error) {
    return { error: `Error creating or fetching GitHub user: ${error}` };
  }
};
