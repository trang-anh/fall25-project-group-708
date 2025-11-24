const mockStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  };
};

describe('tokenStorage (client)', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;
  let storeAuthToken: typeof import('../../../client/src/utils/tokenStorage').storeAuthToken;
  let loadAuthToken: typeof import('../../../client/src/utils/tokenStorage').loadAuthToken;
  let clearAuthToken: typeof import('../../../client/src/utils/tokenStorage').clearAuthToken;
  let TOKEN_STORAGE_KEY: string;

  beforeEach(() => {
    // @ts-ignore
    global.window = {
      localStorage: mockStorage(),
      sessionStorage: mockStorage(),
    };
    // @ts-ignore
    global.document = { cookie: '' };

    jest.resetModules();
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tokenStorage = require('../../../client/src/utils/tokenStorage');
      storeAuthToken = tokenStorage.storeAuthToken;
      loadAuthToken = tokenStorage.loadAuthToken;
      clearAuthToken = tokenStorage.clearAuthToken;
      TOKEN_STORAGE_KEY = tokenStorage.TOKEN_STORAGE_KEY;
    });
  });

  afterEach(() => {
    clearAuthToken();
    // @ts-ignore
    global.window = originalWindow;
    // @ts-ignore
    global.document = originalDocument;
  });

  it('stores tokens in localStorage when persist=true', () => {
    storeAuthToken('persisted', true);
    expect(global.window?.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('persisted');
    expect(global.window?.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('stores tokens in sessionStorage when persist=false', () => {
    storeAuthToken('temp', false);
    expect(global.window?.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe('temp');
    expect(global.window?.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('clears tokens from all storage locations and cookies', () => {
    storeAuthToken('persisted', true);
    storeAuthToken('temp', false);
    // @ts-ignore
    global.document.cookie = 'fake_so_token=cookieval';

    clearAuthToken();

    expect(global.window?.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(global.window?.sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    // @ts-ignore
    expect(global.document.cookie).toContain('fake_so_token=');
  });

  it('loads token from storage first, then cookie fallback', () => {
    // Cookie fallback
    // @ts-ignore
    global.document.cookie = 'fake_so_token=cookieval';
    expect(loadAuthToken()).toBe('cookieval');

    // Storage takes priority
    storeAuthToken('persisted', true);
    expect(loadAuthToken()).toBe('persisted');
  });
});
