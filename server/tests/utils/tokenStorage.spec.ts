type SimpleStorage = {
  length: number;
  clear: () => void;
  getItem: (key: string) => string | null;
  key: (index: number) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
};

const mockStorage = (): SimpleStorage => {
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
  let tokenStorageKey: string;

  beforeEach(() => {
    // @ts-expect-error - provide minimal window stub for tests
    global.window = {
      localStorage: mockStorage(),
      sessionStorage: mockStorage(),
    };
    // @ts-expect-error - provide minimal document stub for tests
    global.document = { cookie: '' };

    jest.resetModules();
    jest.isolateModules(() => {
      // Load module synchronously using jest helper to avoid top-level imports
      const tokenStorage = jest.requireActual(
        '../../../client/src/utils/tokenStorage',
      ) as typeof import('../../../client/src/utils/tokenStorage');
      storeAuthToken = tokenStorage.storeAuthToken;
      loadAuthToken = tokenStorage.loadAuthToken;
      clearAuthToken = tokenStorage.clearAuthToken;
      tokenStorageKey = tokenStorage.TOKEN_STORAGE_KEY;
    });
  });

  afterEach(() => {
    clearAuthToken();
    global.window = originalWindow;
    global.document = originalDocument;
  });

  it('stores tokens in localStorage when persist=true', () => {
    storeAuthToken('persisted', true);
    expect(global.window?.localStorage.getItem(tokenStorageKey)).toBe('persisted');
    expect(global.window?.sessionStorage.getItem(tokenStorageKey)).toBeNull();
  });

  it('stores tokens in sessionStorage when persist=false', () => {
    storeAuthToken('temp', false);
    expect(global.window?.sessionStorage.getItem(tokenStorageKey)).toBe('temp');
    expect(global.window?.localStorage.getItem(tokenStorageKey)).toBeNull();
  });

  it('clears tokens from all storage locations and cookies', () => {
    storeAuthToken('persisted', true);
    storeAuthToken('temp', false);
    global.document.cookie = 'fake_so_token=cookieval';

    clearAuthToken();

    expect(global.window?.localStorage.getItem(tokenStorageKey)).toBeNull();
    expect(global.window?.sessionStorage.getItem(tokenStorageKey)).toBeNull();
    expect(global.document.cookie).toContain('fake_so_token=');
  });

  it('loads token from storage first, then cookie fallback', () => {
    // Cookie fallback
    global.document.cookie = 'fake_so_token=cookieval';
    expect(loadAuthToken()).toBe('cookieval');

    // Storage takes priority
    storeAuthToken('persisted', true);
    expect(loadAuthToken()).toBe('persisted');
  });
});
