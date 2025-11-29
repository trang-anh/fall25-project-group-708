import { signJwt, verifyJwt, extractJwtFromRequest } from '../../services/jwt.service';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

jest.mock('jsonwebtoken');

describe('jwt.service', () => {
  const user = { _id: 'user1', username: 'testuser' };

  it('signJwt returns a string', () => {
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');
    const token = signJwt(user as any);
    expect(token).toBe('signed-token');
  });

  it('verifyJwt returns payload for valid token', () => {
    const payload = { userId: 'user1', username: 'testuser' };
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    const result = verifyJwt('token');
    expect(result).toEqual(payload);
  });

  it('verifyJwt returns null if jwt.verify throws', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('fail');
    });
    const result = verifyJwt('token');
    expect(result).toBeNull();
  });

  it('verifyJwt returns null if jwt.verify returns string', () => {
    (jwt.verify as jest.Mock).mockReturnValue('some string');
    const result = verifyJwt('token');
    expect(result).toBeNull();
  });

  it('verifyJwt returns null if userId or username missing', () => {
    (jwt.verify as jest.Mock).mockReturnValue({ userId: '', username: '' });
    const result = verifyJwt('token');
    expect(result).toBeNull();
  });

  it('extractJwtFromRequest returns token from header', () => {
    const req = { headers: { authorization: 'Bearer abc123' } } as Request;
    const token = extractJwtFromRequest(req);
    expect(token).toBe('abc123');
  });

  it('extractJwtFromRequest returns token from cookie', () => {
    const req = { headers: { cookie: 'fake_so_token=token123;' } } as Request;
    const token = extractJwtFromRequest(req);
    expect(token).toBe('token123');
  });

  it('extractJwtFromRequest returns undefined if no token', () => {
    const req = { headers: {} } as Request;
    const token = extractJwtFromRequest(req);
    expect(token).toBeUndefined();
  });
});
