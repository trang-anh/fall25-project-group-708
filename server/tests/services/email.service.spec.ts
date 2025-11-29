describe('email.service', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  it('returns false when SENDGRID_API_KEY is missing', async () => {
    delete process.env.SENDGRID_API_KEY;

    const { default: sendTwoFactorCodeEmail } = await import('../../services/email.service');

    await expect(sendTwoFactorCodeEmail('user@example.com', '123456')).resolves.toBe(false);
  });

  it('sends email when API key is present', async () => {
    process.env.SENDGRID_API_KEY = 'test-key';
    const sendMock = jest.fn().mockResolvedValue(undefined);
    const setApiKeyMock = jest.fn();

    jest.doMock('@sendgrid/mail', () => ({
      __esModule: true,
      default: {
        setApiKey: setApiKeyMock,
        send: sendMock,
      },
    }));

    const { default: sendTwoFactorCodeEmail } = await import('../../services/email.service');

    await expect(sendTwoFactorCodeEmail('user@example.com', '654321')).resolves.toBe(true);
    expect(setApiKeyMock).toHaveBeenCalledWith('test-key');
    expect(sendMock).toHaveBeenCalled();
  });

  it('returns false when sending throws an error', async () => {
    process.env.SENDGRID_API_KEY = 'test-key';
    const sendMock = jest.fn().mockRejectedValue(new Error('fail'));

    jest.doMock('@sendgrid/mail', () => ({
      __esModule: true,
      default: {
        setApiKey: jest.fn(),
        send: sendMock,
      },
    }));

    const { default: sendTwoFactorCodeEmail } = await import('../../services/email.service');

    await expect(sendTwoFactorCodeEmail('user@example.com', '999999')).resolves.toBe(false);
    expect(sendMock).toHaveBeenCalled();
  });
});
