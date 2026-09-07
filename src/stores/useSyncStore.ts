import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  /** ISO момента последней успешной синхронизации (persisted — показываем
   *  «Синхронизировано N минут назад» даже после рестарта). */
  lastSyncedAt: string | null;
  /** Текст последней ошибки (для диагностики в настройках). */
  error: string | null;
  /**
   * Водяные знаки инкрементального пуша: по таблице — максимальный `updatedAt`,
   * который уже уехал в облако. Ключ `<userId>:<таблица>`.
   *
   * userId в ключе обязателен: без него после входа под другим аккаунтом на том
   * же устройстве чужая метка спрятала бы все его строки от отправки.
   *
   * Сравнение всегда числовое (Date.getTime), не лексикографическое — Postgres
   * сериализует timestamptz иначе, чем JS toISOString().
   */
  pushMarks: Record<string, string>;
  /**
   * Водяные знаки инкрементальной ВЫГРУЗКИ: по таблице — до какого момента
   * серверного времени данные уже забраны. Ключ `<userId>:<таблица>`.
   * Значение — server_updated_at, а не updated_at: серверную отметку ставит
   * триггер в БД, её нельзя испортить часами устройства.
   */
  pullMarks: Record<string, string>;
  /** Когда по этому аккаунту последний раз тянули ВСЁ. Ключ — userId. */
  lastFullPullAt: Record<string, string>;

  setStatus: (status: SyncStatus) => void;
  setSynced: (at: string) => void;
  setError: (message: string) => void;
  /** Продвинуть метку таблицы. Назад метка не откатывается. */
  advancePushMark: (key: string, iso: string) => void;
  /** Продвинуть метку выгрузки. Назад не откатывается. */
  advancePullMark: (key: string, iso: string) => void;
  /** Отметить, что по аккаунту сделана полная выгрузка. */
  markFullPull: (userId: string, iso: string) => void;
  /** Забыть все метки синхронизации — при выходе и смене аккаунта. */
  clearSyncMarks: () => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      lastSyncedAt: null,
      error: null,
      pushMarks: {},
      pullMarks: {},
      lastFullPullAt: {},

      setStatus: (status) => set({ status }),
      setSynced: (at) => set({ status: 'synced', lastSyncedAt: at, error: null }),
      setError: (message) => set({ status: 'error', error: message }),
      advancePushMark: (key, iso) =>
        set((s) => {
          const было = s.pushMarks[key];
          const новее = !было || new Date(iso).getTime() > new Date(было).getTime();
          return новее ? { pushMarks: { ...s.pushMarks, [key]: iso } } : {};
        }),
      advancePullMark: (key, iso) =>
        set((s) => {
          const было = s.pullMarks[key];
          const новее = !было || new Date(iso).getTime() > new Date(было).getTime();
          return новее ? { pullMarks: { ...s.pullMarks, [key]: iso } } : {};
        }),
      markFullPull: (userId, iso) =>
        set((s) => ({ lastFullPullAt: { ...s.lastFullPullAt, [userId]: iso } })),
      clearSyncMarks: () => set({ pushMarks: {}, pullMarks: {}, lastFullPullAt: {} }),
      reset: () => set({ status: 'idle', error: null }),
    }),
    {
      name: 'masterbook-sync',
      storage: createJSONStorage(() => AsyncStorage),
      // status/error — runtime-only. lastSyncedAt показываем в интерфейсе,
      // pushMarks нужны между запусками: иначе после каждого перезапуска
      // приложение заново заливало бы весь набор.
      partialize: (s) => ({
        lastSyncedAt: s.lastSyncedAt,
        pushMarks: s.pushMarks,
        pullMarks: s.pullMarks,
        lastFullPullAt: s.lastFullPullAt,
      }),
    },
  ),
);
