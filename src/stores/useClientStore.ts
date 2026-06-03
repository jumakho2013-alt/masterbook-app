import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Client } from '@/src/types';
import { generateId } from '@/src/utils/helpers';
import { nowIso } from '@/src/utils/date';
import { mergeRemote, type RemoteChange, type Tombstone } from '@/src/lib/syncMerge';
import { notifyLocalMutation } from '@/src/lib/cloudSyncSignal';

interface ClientState {
  clients: Client[];
  /** Локальные удаления, ждущие пуша на сервер (deleted_at). */
  tombstones: Tombstone[];

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client | null;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  canAddClient: () => boolean;
  /** Слить серверные изменения (LWW). Возвращает id удалений, которые сервер
   *  уже знает — их чистим из локальных tombstones в cloudSync. */
  mergeRemote: (remote: RemoteChange<Client>[]) => string[];
  /** Убрать tombstones, успешно отправленные на сервер. */
  clearTombstones: (ids: string[]) => void;
  /** Полный сброс in-memory state (используется при signOut / deleteAccount) */
  reset: () => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      clients: [],
      tombstones: [],

      addClient: (data) => {
        const now = nowIso();
        const client: Client = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ clients: [client, ...s.clients] }));
        notifyLocalMutation();
        return client;
      },

      updateClient: (id, updates) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: nowIso() } : c,
          ),
        }));
        notifyLocalMutation();
      },

      deleteClient: (id) => {
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== id),
          tombstones: [
            ...s.tombstones.filter((t) => t.id !== id),
            { id, deletedAt: nowIso() },
          ],
        }));
        notifyLocalMutation();
      },

      getClient: (id) => get().clients.find((c) => c.id === id),

      searchClients: (query) => {
        const q = query.toLowerCase().trim();
        if (!q) return get().clients;
        return get().clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.notes.toLowerCase().includes(q),
        );
      },

      // Лимита больше нет: PRO-биллинг ещё не построен, поэтому ограничение
      // было тупиком (упёрся → заплатить нельзя). Вернём, когда появится оплата.
      canAddClient: () => true,

      mergeRemote: (remote) => {
        const { records, appliedDeletes } = mergeRemote(get().clients, remote);
        // Стабильный порядок: новые сверху (по createdAt убыв.).
        records.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
        set({ clients: records });
        return appliedDeletes;
      },

      clearTombstones: (ids) =>
        set((s) => ({ tombstones: s.tombstones.filter((t) => !ids.includes(t.id)) })),

      reset: () => set({ clients: [], tombstones: [] }),
    }),
    {
      name: 'masterbook-clients',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
