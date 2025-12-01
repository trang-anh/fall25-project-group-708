import supertest from 'supertest';
import { app } from '../../app';
import * as twoFactorService from '../../services/twoFactor.service';
import { Types } from 'mongoose';

describe('User 2FA endpoints', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates a 2FA code', async () => {
    jest.spyOn(twoFactorService, 'generate2FACode').mockResolvedValue({ code: '123456' });

    const response = await supertest(app)
      .post('/api/user/2fa/generate/testuser')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: '123456' });
    expect(twoFactorService.generate2FACode).toHaveBeenCalledWith('testuser', 'test@example.com');
  });

  it('returns 500 when generating code throws', async () => {
    jest.spyOn(twoFactorService, 'generate2FACode').mockRejectedValue(new Error('boom'));

    const response = await supertest(app)
      .post('/api/user/2fa/generate/testuser')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(500);
  });

  it('enables 2FA when code is valid', async () => {
    jest.spyOn(twoFactorService, 'verifyAndEnable2FA').mockResolvedValue({
      _id: new Types.ObjectId(),
      username: 'testuser',
      dateJoined: new Date('2024-01-01'),
    });

    const response = await supertest(app)
      .post('/api/user/2fa/enable')
      .send({ username: 'testuser', code: '123456' });

    expect(response.status).toBe(200);
    expect(twoFactorService.verifyAndEnable2FA).toHaveBeenCalledWith('testuser', '123456');
  });

  it('returns 400 when enabling 2FA without username or code', async () => {
    const response = await supertest(app).post('/api/user/2fa/enable').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: 'Request Validation Failed',
    });
  });

  it('returns 400 when enabling 2FA with empty username/code (controller validation)', async () => {
    const response = await supertest(app)
      .post('/api/user/2fa/enable')
      .send({ username: '', code: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Username and code are required' });
  });

  it('returns 400 when enabling 2FA service returns error', async () => {
    jest
      .spyOn(twoFactorService, 'verifyAndEnable2FA')
      .mockResolvedValue({ error: 'invalid code' } as any);

    const response = await supertest(app)
      .post('/api/user/2fa/enable')
      .send({ username: 'testuser', code: 'bad' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid code' });
  });

  it('returns 500 when enabling 2FA throws', async () => {
    jest.spyOn(twoFactorService, 'verifyAndEnable2FA').mockRejectedValue(new Error('boom'));

    const response = await supertest(app)
      .post('/api/user/2fa/enable')
      .send({ username: 'testuser', code: '123456' });

    expect(response.status).toBe(500);
  });

  it('disables 2FA', async () => {
    jest.spyOn(twoFactorService, 'disable2FA').mockResolvedValue({
      _id: new Types.ObjectId(),
      username: 'testuser',
      dateJoined: new Date('2024-01-01'),
    });

    const response = await supertest(app)
      .post('/api/user/2fa/disable')
      .send({ username: 'testuser' });

    expect(response.status).toBe(200);
    expect(twoFactorService.disable2FA).toHaveBeenCalledWith('testuser');
  });

  it('returns 400 when disabling 2FA without username', async () => {
    const response = await supertest(app).post('/api/user/2fa/disable').send({});

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: 'Request Validation Failed',
    });
  });

  it('returns 400 when disabling 2FA with empty username (controller validation)', async () => {
    const response = await supertest(app).post('/api/user/2fa/disable').send({ username: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Username is required' });
  });

  it('returns 400 when disabling 2FA service returns error', async () => {
    jest.spyOn(twoFactorService, 'disable2FA').mockResolvedValue({ error: 'fail' } as any);

    const response = await supertest(app)
      .post('/api/user/2fa/disable')
      .send({ username: 'testuser' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'fail' });
  });

  it('returns 500 when disabling 2FA throws', async () => {
    jest.spyOn(twoFactorService, 'disable2FA').mockRejectedValue(new Error('boom'));

    const response = await supertest(app)
      .post('/api/user/2fa/disable')
      .send({ username: 'testuser' });

    expect(response.status).toBe(500);
  });

  it('reports 2FA status', async () => {
    jest.spyOn(twoFactorService, 'is2FAEnabled').mockResolvedValue(true);

    const response = await supertest(app).get('/api/user/2fa/status/testuser');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ twoFactorEnabled: true });
    expect(twoFactorService.is2FAEnabled).toHaveBeenCalledWith('testuser');
  });
});
