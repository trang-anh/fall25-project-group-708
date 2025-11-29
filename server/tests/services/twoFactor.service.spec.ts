import UserModel from '../../models/users.model';
import sendTwoFactorCodeEmail from '../../services/email.service';
import {
  generate2FACode,
  verifyAndEnable2FA,
  disable2FA,
  is2FAEnabled,
  verify2FACode,
  generateCode,
} from '../../services/twoFactor.service';

jest.mock('../../models/users.model');
jest.mock('../../services/email.service');

const MockedUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockedSendEmail = sendTwoFactorCodeEmail as jest.MockedFunction<
  typeof sendTwoFactorCodeEmail
>;

describe('twoFactor.service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  //  generate2FACode
  describe('generate2FACode', () => {
    it('returns error if user not found', async () => {
      MockedUserModel.findOne.mockResolvedValue(null as any);
      const res = await generate2FACode('unknown');
      expect(res).toEqual({ error: 'User not found' });
    });

    it('returns error if email is missing', async () => {
      const user: any = { username: 'user1', email: null, save: jest.fn() };
      MockedUserModel.findOne.mockResolvedValue(user);
      const res = await generate2FACode('user1');
      expect(res).toEqual({ error: 'Email is required to send the verification code' });
    });

    it('generates code and sends email', async () => {
      const user: any = { username: 'user1', email: 'test@example.com', save: jest.fn() };
      MockedUserModel.findOne.mockResolvedValue(user);
      mockedSendEmail.mockResolvedValueOnce(true);

      const res = await generate2FACode('user1');

      if ('error' in res) {
        throw new Error(`Unexpected error: ${res.error}`);
      }

      expect(user.twoFactorCode).toBe(res.code);
      expect(mockedSendEmail).toHaveBeenCalledWith(user.email, res.code);
      expect(user.save).toHaveBeenCalled();
    });

    it('handles email parameter correctly', async () => {
      const user: any = { username: 'user1', email: null, save: jest.fn() };
      MockedUserModel.findOne.mockResolvedValue(user);
      mockedSendEmail.mockResolvedValueOnce(true);

      const res = await generate2FACode('user1', 'new@example.com');
      expect(user.email).toBe('new@example.com');
      expect(res).toHaveProperty('code');
    });

    it('catches exceptions', async () => {
      MockedUserModel.findOne.mockImplementation(() => {
        throw new Error('fail');
      });
      const res = await generate2FACode('user1');
      expect(res).toHaveProperty('error');
      expect((res as any).error).toContain('fail');
    });
  });

  // verifyAndEnable2FA
  describe('verifyAndEnable2FA', () => {
    it('returns error if user not found', async () => {
      MockedUserModel.findOne.mockResolvedValue(null as any);
      const res = await verifyAndEnable2FA('unknown', '123456');
      expect(res).toEqual({ error: 'User not found' });
    });

    it('returns error if code is invalid', async () => {
      const user: any = { username: 'user1', twoFactorCode: '654321', save: jest.fn() };
      MockedUserModel.findOne.mockResolvedValue(user);
      const res = await verifyAndEnable2FA('user1', '123456');
      expect(res).toEqual({ error: 'Invalid verification code' });
    });

    it('enables 2FA when code is valid', async () => {
      const user: any = { username: 'user1', twoFactorCode: '123456', save: jest.fn() };
      MockedUserModel.findOne.mockResolvedValue(user);
      const res = await verifyAndEnable2FA('user1', '123456');
      expect(user.twoFactorEnabled).toBe(true);
      expect(user.twoFactorCode).toBeNull();
      expect(user.save).toHaveBeenCalled();
      expect(res).toEqual(user);
    });

    it('catches exceptions', async () => {
      MockedUserModel.findOne.mockImplementation(() => {
        throw new Error('fail');
      });
      const res = await verifyAndEnable2FA('user1', '123456');
      expect(res).toHaveProperty('error');
      expect((res as any).error).toContain('fail');
    });

    it('verifyAndEnable2FA handles exceptions', async () => {
      MockedUserModel.findOne.mockImplementation(() => {
        throw new Error('fail');
      });
      const res = await verifyAndEnable2FA('user1', '123456');
      expect(res).toHaveProperty('error');
    });
  });

  // disable2FA
  describe('disable2FA', () => {
    it('returns error if user not found', async () => {
      MockedUserModel.findOneAndUpdate.mockResolvedValue(null as any);
      const res = await disable2FA('unknown');
      expect(res).toEqual({ error: 'User not found' });
    });

    it('disables 2FA successfully', async () => {
      const user: any = { username: 'user1', twoFactorEnabled: false, twoFactorCode: null };
      MockedUserModel.findOneAndUpdate.mockResolvedValue(user);
      const res = await disable2FA('user1');
      expect(res).toEqual(user);
    });

    it('catches exceptions', async () => {
      MockedUserModel.findOneAndUpdate.mockImplementation(() => {
        throw new Error('fail');
      });
      const res = await disable2FA('user1');
      expect(res).toHaveProperty('error');
      expect((res as any).error).toContain('fail');
    });

    it('disable2FA handles exceptions', async () => {
      MockedUserModel.findOneAndUpdate.mockImplementation(() => {
        throw new Error('fail');
      });
      const res = await disable2FA('user1');
      expect(res).toHaveProperty('error');
    });
  });

  //  is2FAEnabled
  describe('is2FAEnabled', () => {
    it('returns true if 2FA enabled', async () => {
      MockedUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ twoFactorEnabled: true }),
      } as any);
      const res = await is2FAEnabled('user1');
      expect(res).toBe(true);
    });

    it('returns false if user not found or 2FA disabled', async () => {
      MockedUserModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) } as any);
      const res = await is2FAEnabled('user1');
      expect(res).toBe(false);
    });
  });

  // verify2FACode
  describe('verify2FACode', () => {
    it('returns false if user not found', async () => {
      MockedUserModel.findOne.mockResolvedValue(null as any);
      const res = await verify2FACode('unknown', '123456');
      expect(res).toBe(false);
    });

    it('returns false if 2FA not enabled', async () => {
      const user: any = { twoFactorEnabled: false };
      MockedUserModel.findOne.mockResolvedValue(user);
      const res = await verify2FACode('user1', '123456');
      expect(res).toBe(false);
    });

    it('returns true if code matches', async () => {
      const user: any = { twoFactorEnabled: true, twoFactorCode: '123456' };
      MockedUserModel.findOne.mockResolvedValue(user);
      const res = await verify2FACode('user1', '123456');
      expect(res).toBe(true);
    });

    it('returns false if code does not match', async () => {
      const user: any = { twoFactorEnabled: true, twoFactorCode: '654321' };
      MockedUserModel.findOne.mockResolvedValue(user);
      const res = await verify2FACode('user1', '123456');
      expect(res).toBe(false);
    });

    it('generate2FACode handles exceptions', async () => {
      MockedUserModel.findOne.mockImplementation(() => {
        throw new Error('fail');
      });
      const res = await generate2FACode('user1');
      expect(res).toHaveProperty('error');
      expect((res as any).error).toContain('fail');
    });

    it('uses username as email if email missing and username includes @', async () => {
      const user: any = { username: 'user@example.com', email: null, save: jest.fn() };
      MockedUserModel.findOne.mockResolvedValue(user);
      mockedSendEmail.mockResolvedValueOnce(true);

      const res = await generate2FACode('user@example.com');

      if ('error' in res) throw new Error(res.error);
      expect(user.email).toBe('user@example.com');
      expect(user.twoFactorCode).toBe(res.code);
    });
  });

  describe('generateCode', () => {
    it('produces a 6-digit numeric string', () => {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
    });
  });
});
