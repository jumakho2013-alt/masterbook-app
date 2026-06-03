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

  setStatus: (status: SyncStatus) => void;
  setSynced: (at: string) => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      lastSyncedAt: null,
      error: null,

      setStatus: (status) => set({ status }),
      setSynced: (at) => set({ status: 'synced', lastSyncedAt: at, error: null }),
      setError: (message) => set({ status: 'error', error: message }),
      reset: () => set({ status: 'idle', error: null }),
    }),
    {
      name: 'masterbook-sync',
      storage: createJSONStorage(() => AsyncStorage),
      // status/error — runtime-only; на диск кладём лишь lastSyncedAt.
      partialize: (s) => ({ lastSyncedAt: s.lastSyncedAt }),
    },
  ),
);
