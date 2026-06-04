// Мокаем всё что трогает нативные модули — AsyncStorage, Supabase,
// notifications — и проверяем ПОРЯДОК вызовов. Если порядок нарушится
// (например, AsyncStorage.clear() до supabase.signOut()), текущие данные
// могут не стереться из-за race-condition. Этот тест — фиксирующая сетка.

const asyncStorageClearMock = jest.fn(async () => undefined);
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
    clear: asyncStorageClearMock,
  },
}));

// Union-возвращаемые моки — чтобы тесты могли подменять успех на ошибку
// через mockImplementationOnce без TypeScript narrowing проблем.
type RpcResult = { error: { message: string } | null };
type SignOutResult = { error: Error | null };
const rpcMock = jest.fn<Promise<RpcResult>, [string]>(async () => ({ error: null }));
const signOutMock = jest.fn<Promise<SignOutResult>, []>(async () => ({ error: null }));
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    rpc: (name: string) => rpcMock(name),
    auth: {
      signOut: () => signOutMock(),
    },
  },
}));

const cancelAllNotificationsMock = jest.fn(async () => undefined);
jest.mock('@/src/lib/notifications', () => ({
  cancelAllNotifications: () => cancelAllNotificationsMock(),
  cancelNotification: jest.fn(),
  scheduleAppointmentReminder: jest.fn(),
  scheduleMorningReminder: jest.fn(),
  registerForPushNotifications: jest.fn(),
}));

const resetAuthMock = jest.fn();
jest.mock('@/src/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ reset: resetAuthMock }),
  },
}));

import { deleteAccount } from '../deleteAccount';

describe('deleteAccount', () => {
  beforeEach(() => {
    asyncStorageClearMock.mockClear();
    rpcMock.mockClear();
    rpcMock.mockImplementation(async () => ({ error: null }));
    signOutMock.mockClear();
    signOutMock.mockImplementation(async () => ({ error: null }));
    cancelAllNotificationsMock.mockClear();
    resetAuthMock.mockClear();
  });

  it('returns ok on happy path and calls all steps in order', async () => {
    const result = await deleteAccount();
    expect(result).toEqual({ ok: true });
    // Порядок важен: нотификации → RPC → signOut → storage → reset.
    expect(cancelAllNotificationsMock).toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith('delete_user');
    expect(signOutMock).toHaveBeenCalled();
    expect(asyncStorageClearMock).toHaveBeenCalled();
    expect(resetAuthMock).toHaveBeenCalled();

    const order = [
      cancelAllNotificationsMock.mock.invocationCallOrder[0],
      rpcMock.mock.invocationCallOrder[0],
      signOutMock.mock.invocationCallOrder[0],
      asyncStorageClearMock.mock.invocationCallOrder[0],
      resetAuthMock.mock.invocationCallOrder[0],
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('still wipes local data even if Supabase RPC fails', async () => {
    rpcMock.mockImplementationOnce(async () => ({ error: { message: 'rpc missing' } }));
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await deleteAccount();
    expect(result).toEqual({ ok: true });
    // Критично: AsyncStorage всё равно очищается. Иначе после
    // переустановки пользователь увидит старые данные.
    expect(asyncStorageClearMock).toHaveBeenCalled();
    expect(resetAuthMock).toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  it('does not throw even if signOut fails silently', async () => {
    signOutMock.mockImplementationOnce(async () => {
      throw new Error('network down');
    });

    const result = await deleteAccount();
    // signOut обёрнут в .catch(() => {}) — не ломает остальной поток.
    expect(result).toEqual({ ok: true });
    expect(asyncStorageClearMock).toHaveBeenCalled();
  });

  it('returns { ok: false } on catastrophic error', async () => {
    asyncStorageClearMock.mockImplementationOnce(async () => {
      throw new Error('disk full');
    });

    const result = await deleteAccount();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('disk full');
    }
  });
});
