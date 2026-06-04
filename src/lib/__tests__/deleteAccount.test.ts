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
const storageRemoveMock = jest.fn<Promise<{ data: unknown; error: null }>, [string[]]>(
  async () => ({ data: [], error: null }),
);
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    rpc: (name: string) => rpcMock(name),
    auth: {
      signOut: () => signOutMock(),
    },
    storage: {
      from: () => ({ remove: (paths: string[]) => storageRemoveMock(paths) }),
    },
  },
}));

// cloudSync импортирует react-native (AppState) — мокаем, чтобы jest не тянул
// нативный модуль. deleteAccount должен останавливать авто-синк.
const stopAutoSyncMock = jest.fn();
jest.mock('@/src/lib/cloudSync', () => ({
  stopAutoSync: () => stopAutoSyncMock(),
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
const setAuthStateMock = jest.fn();
let mockLocalOnly = false;
jest.mock('@/src/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ reset: resetAuthMock, localOnlyMode: mockLocalOnly }),
    setState: (s: unknown) => setAuthStateMock(s),
  },
}));

const resetClientMock = jest.fn();
const resetAppointmentMock = jest.fn();
const resetFinanceMock = jest.fn();
const resetServiceMock = jest.fn();
const resetSettingsMock = jest.fn();
let mockClients: Array<{ id: string; photoUri?: string }> = [];
let mockAppointments: Array<{ id: string; photos?: string[] }> = [];
jest.mock('@/src/stores/useClientStore', () => ({
  useClientStore: { getState: () => ({ reset: resetClientMock, clients: mockClients }) },
}));
jest.mock('@/src/stores/useAppointmentStore', () => ({
  useAppointmentStore: {
    getState: () => ({ reset: resetAppointmentMock, appointments: mockAppointments }),
  },
}));
jest.mock('@/src/stores/useFinanceStore', () => ({
  useFinanceStore: { getState: () => ({ reset: resetFinanceMock }) },
}));
jest.mock('@/src/stores/useServiceStore', () => ({
  useServiceStore: { getState: () => ({ reset: resetServiceMock }) },
}));
jest.mock('@/src/stores/useSettingsStore', () => ({
  useSettingsStore: { getState: () => ({ reset: resetSettingsMock }) },
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
    setAuthStateMock.mockClear();
    resetClientMock.mockClear();
    resetAppointmentMock.mockClear();
    resetFinanceMock.mockClear();
    resetServiceMock.mockClear();
    resetSettingsMock.mockClear();
    storageRemoveMock.mockClear();
    mockClients = [];
    mockAppointments = [];
    mockLocalOnly = false; // Default: cloud-account path
  });

  it('returns ok on happy path and calls all steps in order', async () => {
    const result = await deleteAccount();
    expect(result).toEqual({ ok: true, serverDeleteFailed: false });
    // Порядок важен: нотификации → RPC → signOut → resets → storage.clear.
    expect(cancelAllNotificationsMock).toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith('delete_user');
    expect(signOutMock).toHaveBeenCalled();
    expect(resetClientMock).toHaveBeenCalled();
    expect(resetAppointmentMock).toHaveBeenCalled();
    expect(resetFinanceMock).toHaveBeenCalled();
    expect(resetServiceMock).toHaveBeenCalled();
    expect(resetSettingsMock).toHaveBeenCalled();
    expect(resetAuthMock).toHaveBeenCalled();
    expect(setAuthStateMock).toHaveBeenCalledWith({ user: null, session: null });
    expect(asyncStorageClearMock).toHaveBeenCalled();

    // Все business-resets должны произойти ДО AsyncStorage.clear() —
    // активные подписки видят пустое in-memory состояние перед тем как
    // персистенс уйдёт.
    const order = [
      cancelAllNotificationsMock.mock.invocationCallOrder[0],
      rpcMock.mock.invocationCallOrder[0],
      signOutMock.mock.invocationCallOrder[0],
      resetClientMock.mock.invocationCallOrder[0],
      resetAuthMock.mock.invocationCallOrder[0],
      asyncStorageClearMock.mock.invocationCallOrder[0],
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('returns serverDeleteFailed=true if Supabase RPC fails (Apple 5.1.1(v) honesty)', async () => {
    rpcMock.mockImplementationOnce(async () => ({ error: { message: 'rpc missing' } }));

    const result = await deleteAccount();
    // Раньше silent fail в console.warn создавал illusion of deletion.
    // Теперь возвращаем флаг чтобы UI прозрачно сказал пользователю.
    expect(result).toEqual({ ok: true, serverDeleteFailed: true, serverError: 'rpc missing' });
    // Локальный wipe всё равно выполнен.
    expect(asyncStorageClearMock).toHaveBeenCalled();
    expect(resetClientMock).toHaveBeenCalled();
    expect(resetAuthMock).toHaveBeenCalled();
  });

  it('does not throw even if signOut fails silently', async () => {
    signOutMock.mockImplementationOnce(async () => {
      throw new Error('network down');
    });

    const result = await deleteAccount();
    // signOut обёрнут в .catch(() => {}) — не ломает остальной поток.
    expect(result).toEqual({ ok: true, serverDeleteFailed: false });
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

  it('wipes ALL business stores (cross-account contamination guard)', async () => {
    await deleteAccount();
    // Если хотя бы один store не сброшен — следующий пользователь на
    // устройстве увидит данные удалённого аккаунта в памяти до перезапуска.
    expect(resetClientMock).toHaveBeenCalledTimes(1);
    expect(resetAppointmentMock).toHaveBeenCalledTimes(1);
    expect(resetFinanceMock).toHaveBeenCalledTimes(1);
    expect(resetServiceMock).toHaveBeenCalledTimes(1);
    expect(resetSettingsMock).toHaveBeenCalledTimes(1);
  });

  it('local-only mode: skips Supabase RPC + signOut entirely', async () => {
    mockLocalOnly = true;
    const result = await deleteAccount();
    expect(result).toEqual({ ok: true, serverDeleteFailed: false });
    // Никаких серверных вызовов — нечего удалять/разлогинивать
    expect(rpcMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    // Но локально всё стёрто
    expect(asyncStorageClearMock).toHaveBeenCalled();
    expect(resetClientMock).toHaveBeenCalled();
    expect(resetAuthMock).toHaveBeenCalled();
  });

  it('removes cloud photos (storage-paths only) from Storage before deletion', async () => {
    mockClients = [
      { id: 'c1', photoUri: 'uid/clients/c1/a.jpg' }, // storage-path → удалить
      { id: 'c2', photoUri: 'file:///local/b.jpg' }, // локальный → пропустить
      { id: 'c3' }, // без фото
    ];
    mockAppointments = [
      { id: 'a1', photos: ['uid/appointments/a1/x.jpg', 'file:///local/y.jpg'] },
    ];
    const result = await deleteAccount();
    expect(result.ok).toBe(true);
    expect(storageRemoveMock).toHaveBeenCalledTimes(1);
    expect(storageRemoveMock).toHaveBeenCalledWith([
      'uid/clients/c1/a.jpg',
      'uid/appointments/a1/x.jpg',
    ]);
  });

  it('local-only mode: does not touch Storage even with photos present', async () => {
    mockLocalOnly = true;
    mockClients = [{ id: 'c1', photoUri: 'uid/clients/c1/a.jpg' }];
    await deleteAccount();
    expect(storageRemoveMock).not.toHaveBeenCalled();
  });
});
