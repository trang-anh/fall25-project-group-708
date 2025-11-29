import {
  buildGithubAuthorizeUrl,
  exchangeCodeForToken,
  fetchGithubUser,
  findOrCreateGithubUser,
  GithubUserProfile,
} from '../../services/auth.service';
import UserModel from '../../models/users.model';

jest.mock('../../models/users.model');

const MockedUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('auth.service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.GITHUB_CLIENT_ID = 'fake-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'fake-client-secret';
    process.env.OAUTH_REDIRECT_URI = 'http://localhost/callback';
  });

  describe('buildGithubAuthorizeUrl', () => {
    it('should return a valid GitHub OAuth URL', () => {
      const url = buildGithubAuthorizeUrl('state123');
      expect(url).toContain('client_id=fake-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%2Fcallback');
      expect(url).toContain('state=state123');
    });

    it('should throw if client_id or client_secret missing', () => {
      delete process.env.GITHUB_CLIENT_ID;
      expect(() => buildGithubAuthorizeUrl('state')).toThrow(
        'GitHub OAuth is not configured properly.',
      );
    });
  });

  describe('exchangeCodeForToken', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return access_token when GitHub responds with success', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'token123' }),
      });

      const token = await exchangeCodeForToken('code123');
      expect(token).toBe('token123');
    });

    it('should throw if GitHub responds not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 400 });

      await expect(exchangeCodeForToken('code123')).rejects.toThrow(
        'Failed to exchange GitHub auth code. Status: 400',
      );
    });

    it('should throw if access_token missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ error_description: 'bad request' }),
      });

      await expect(exchangeCodeForToken('code123')).rejects.toThrow('bad request');
    });
  });

  describe('fetchGithubUser', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should return user profile on success', async () => {
      const profile: GithubUserProfile = { id: 1, login: 'tester' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => profile,
      });

      const user = await fetchGithubUser('token123');
      expect(user).toEqual(profile);
    });

    it('should throw if response not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });

      await expect(fetchGithubUser('token123')).rejects.toThrow(
        'Failed to fetch GitHub user profile. Status: 401',
      );
    });

    it('should throw if profile missing required fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await expect(fetchGithubUser('token123')).rejects.toThrow(
        'GitHub user profile is missing required fields.',
      );
    });
  });

  describe('findOrCreateGithubUser', () => {
    const sampleProfile: GithubUserProfile = { id: 1, login: 'tester', bio: 'bio' };

    it('should return existing user if found', async () => {
      const mockUser = {
        _id: 'u1',
        username: 'tester',
        dateJoined: new Date(),
        biography: 'bio',
        githubId: '1',
        totalPoints: 10,
      };
      MockedUserModel.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const user = await findOrCreateGithubUser(sampleProfile);
      expect(user).toEqual({
        _id: mockUser._id,
        username: mockUser.username,
        dateJoined: mockUser.dateJoined,
        biography: mockUser.biography,
        githubId: mockUser.githubId,
        totalPoints: mockUser.totalPoints,
      });
    });

    it('should create a new user if not found', async () => {
      MockedUserModel.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      } as any);
      const createdUser = {
        _id: 'u2',
        username: 'tester',
        dateJoined: new Date(),
        biography: 'bio',
        githubId: '1',
        totalPoints: 0,
      };
      MockedUserModel.create.mockResolvedValue(createdUser as any);

      const user = await findOrCreateGithubUser(sampleProfile);

      expect(user).not.toHaveProperty('error');
      expect((user as any)._id).toBe(createdUser._id);

      expect(MockedUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'tester',
          githubId: '1',
          biography: 'bio',
        }),
      );
    });

    it('should return error object if UserModel throws', async () => {
      MockedUserModel.findOne.mockImplementation(() => {
        throw new Error('fail');
      });

      const user = await findOrCreateGithubUser(sampleProfile);
      expect(user).toHaveProperty('error');
      expect((user as any).error).toContain('fail');
    });
  });
});
