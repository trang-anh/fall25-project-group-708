import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as jwtService from '../../services/jwt.service';
import UserModel from '../../models/users.model';
import * as userService from '../../services/user.service';
import * as sessionService from '../../services/session.service';
import { API_TOKEN_COOKIE_NAME } from '../../services/jwt.service';
import { SESSION_COOKIE_NAME } from '../../services/session.service';

describe('Auth/JWT integration', () => {
  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    username: 'tokenuser',
    dateJoined: new Date('2024-01-01'),
    biography: '',
    githubId: undefined,
    totalPoints: 0,
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns authenticated user when valid JWT is provided', async () => {
    jest.spyOn(jwtService, 'verifyJwt').mockReturnValue({
      userId: mockUser._id.toString(),
      username: mockUser.username,
      exp: Date.now() + 1000 * 60,
      iat: Date.now() / 1000,
    });

    jest.spyOn(UserModel, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    } as unknown as ReturnType<typeof UserModel.findById>);

    const response = await supertest(app)
      .get('/api/auth/user')
      .set('Authorization', 'Bearer fake.jwt.token');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      authenticated: true,
      user: {
        _id: mockUser._id.toString(),
        username: mockUser.username,
      },
      token: 'fake.jwt.token',
    });
    expect(jwtService.verifyJwt).toHaveBeenCalledWith('fake.jwt.token');
  });

  it('sets persistent token cookie when rememberDevice is true', async () => {
    jest.spyOn(jwtService, 'signJwt').mockReturnValue('signed.jwt.token');
    jest.spyOn(jwtService, 'getJwtTtl').mockReturnValue(12345);
    const loginUserSpy = jest.spyOn(userService, 'loginUser');
    loginUserSpy.mockResolvedValue({
      _id: mockUser._id,
      username: mockUser.username,
      dateJoined: mockUser.dateJoined,
    });

    const response = await supertest(app)
      .post('/api/user/login')
      .send({ username: mockUser.username, password: 'pw', rememberDevice: true });

    const cookiesHeader = response.headers['set-cookie'];
    const cookies = Array.isArray(cookiesHeader)
      ? cookiesHeader
      : cookiesHeader
        ? [cookiesHeader]
        : [];
    const tokenCookie = cookies.find(cookie => cookie.startsWith('fake_so_token='));

    expect(response.status).toBe(200);
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('Max-Age=');
    expect(response.body).toMatchObject({
      user: {
        _id: mockUser._id.toString(),
        username: mockUser.username,
      },
      token: 'signed.jwt.token',
    });
  });

  it('returns unauthenticated when JWT invalid and no session exists', async () => {
    jest.spyOn(jwtService, 'verifyJwt').mockImplementation(() => {
      throw new Error('invalid token');
    });

    const response = await supertest(app).get('/api/auth/user');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ authenticated: false });
  });

  it('falls back to session when JWT fails and returns a fresh token', async () => {
    jest.spyOn(jwtService, 'verifyJwt').mockImplementation(() => {
      throw new Error('invalid token');
    });
    jest.spyOn(jwtService, 'signJwt').mockReturnValue('new.jwt.token');
    jest.spyOn(jwtService, 'getJwtTtl').mockReturnValue(7777);
    jest.spyOn(UserModel, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    } as unknown as ReturnType<typeof UserModel.findById>);

    const sessionUser = {
      _id: mockUser._id,
      username: mockUser.username,
      dateJoined: mockUser.dateJoined,
      biography: '',
      githubId: undefined,
      totalPoints: 0,
    };
    jest.spyOn(sessionService, 'getSessionUser').mockReturnValue(sessionUser);

    const response = await supertest(app)
      .get('/api/auth/user')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=abc123`]);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      authenticated: true,
      user: { username: mockUser.username },
      token: 'new.jwt.token',
    });
    const cookiesHeader = response.headers['set-cookie'];
    const cookies = Array.isArray(cookiesHeader)
      ? cookiesHeader
      : cookiesHeader
        ? [cookiesHeader]
        : [];
    expect(cookies.some(cookie => cookie.startsWith(`${API_TOKEN_COOKIE_NAME}=`))).toBe(true);
  });

  it('logout clears cookies when session is present', async () => {
    jest.spyOn(jwtService, 'verifyJwt').mockImplementation(() => {
      throw new Error('invalid');
    });
    jest.spyOn(sessionService, 'getSessionUser').mockReturnValue({
      username: 'foo',
      _id: mockUser._id,
    } as any);
    const deleteSessionSpy = jest
      .spyOn(sessionService, 'deleteSession')
      .mockImplementation(() => {});

    const response = await supertest(app)
      .post('/api/auth/logout')
      .set('Cookie', [`${SESSION_COOKIE_NAME}=abc123`]);

    expect(response.status).toBe(200);
    expect(deleteSessionSpy).toHaveBeenCalled();
    const cookiesHeader = response.headers['set-cookie'];
    const cookies = Array.isArray(cookiesHeader)
      ? cookiesHeader
      : cookiesHeader
        ? [cookiesHeader]
        : [];
    expect(cookies.some(cookie => cookie.startsWith(`${SESSION_COOKIE_NAME}=;`))).toBe(true);
    expect(cookies.some(cookie => cookie.startsWith(`${API_TOKEN_COOKIE_NAME}=;`))).toBe(true);
  });

  it('logout returns 401 when no auth context found', async () => {
    jest.spyOn(jwtService, 'verifyJwt').mockImplementation(() => {
      throw new Error('invalid');
    });
    jest.spyOn(sessionService, 'getSessionUser').mockReturnValue(undefined);

    const response = await supertest(app).post('/api/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Not authenticated' });
  });
});
