// Мокируем AsyncStorage для node-окружения. Храним в памяти.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: jest.fn(async (k: string) => {
        store.delete(k);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
      // Exposed for tests — не в типах, но работает.
      __store: store,
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkAuthRateLimit,
  recordAuthFailure,
  resetAuthRateLimit,
  formatRetryDuration,
} from '../authRateLimit';

beforeEach(async () => {
  // @ts-expect-error — тестовый escape hatch
  AsyncStorage.__store.clear();
});

describe('checkAuthRateLimit', () => {
  it('returns unlocked with full budget when empty', async () => {
    const s = await checkAuthRateLimit();
    expect(s.locked).toBe(false);
    expect(s.attemptsLeft).toBe(5);
    expect(s.retryInMs).toBe(0);
  });
});

describe('recordAuthFailure', () => {
  it('does not lock for 1–4 failures', async () => {
    for (let i = 0; i < 4; i++) {
      const s = await recordAuthFailure();
      expect(s.locked).toBe(false);
    }
    expect((await checkAuthRateLimit()).attemptsLeft).toBe(1);
  });

  it('locks on the 5th failure with 15s cooldown', async () => {
    for (let i = 0; i < 4; i++) await recordAuthFailure();
    const s = await recordAuthFailure();
    expect(s.locked).toBe(true);
    expect(s.retryInMs).toBeGreaterThan(14_000);
    expect(s.retryInMs).toBeLessThanOrEqual(15_000);
  });

  it('doubles cooldown on further failures', async () => {
    for (let i = 0; i < 5; i++) await recordAuthFailure();
    const s6 = await recordAuthFailure();
    // 6-я неудача → базовый × 2 = 30 сек
    expect(s6.retryInMs).toBeGreaterThan(29_000);
    expect(s6.retryInMs).toBeLessThanOrEqual(30_000);
  });
});

describe('resetAuthRateLimit', () => {
  it('clears after successful login', async () => {
    for (let i = 0; i < 3; i++) await recordAuthFailure();
    await resetAuthRateLimit();
    const s = await checkAuthRateLimit();
    expect(s.attemptsLeft).toBe(5);
    expect(s.locked).toBe(false);
  });
});

describe('formatRetryDuration', () => {
  it.each([
    [5_000, '5 сек'],
    [59_000, '59 сек'],
    [60_000, '1 мин'],
    [90_000, '1 мин 30 сек'],
    [600_000, '10 мин'],
  ])('%d ms → %s', (ms, expected) => {
    expect(formatRetryDuration(ms)).toBe(expected);
  });
});
