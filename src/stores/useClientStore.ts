import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { coalescedStorage } from '@/src/lib/persistStorage';
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
  /** Массовое добавление (импорт контактов) — ОДИН set() на всю пачку.
   *  Поштучный addClient сериализовал стор на каждого контакта: импорт 200
   *  штук при базе 1500 замораживал интерфейс на несколько секунд. */
  addClients: (list: Omit<Client, 'id' | 'createdAt'>[]) => number;
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

      addClients: (list) => {
        if (list.length === 0) return 0;
        const now = nowIso();
        const created = list.map((c, i) => ({
          ...c,
          id: `${generateId()}-${i}`,
          createdAt: now,
          updatedAt: now,
        })) as Client[];
        set((s) => ({ clients: [...created, ...s.clients] }));
        notifyLocalMutation();
        return created.length;
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
        const { records, appliedDeletes } = mergeRemote(get().clients, remote, get().tombstones);
        // Стабильный порядок: новые сверху (по createdAt убыв.).
        // Сравниваем лексикографически, а не через localeCompare: createdAt —
        // ISO-8601, он и так упорядочен, а localeCompare на Hermes уходит в
        // нативный ICU и на 1500 клиентов давал десятки мс фриза на каждом pull.
        records.sort((a, b) => {
          const x = a.createdAt ?? '';
          const y = b.createdAt ?? '';
          return x < y ? 1 : x > y ? -1 : 0;
        });
        set({ clients: records });
        return appliedDeletes;
      },

      clearTombstones: (ids) => {
        // Set вместо includes: filter+includes — O(n*m), на тысячах удалений
        // это заметная пауза прямо в момент синка.
        const drop = new Set(ids);
        set((s) => ({ tombstones: s.tombstones.filter((t) => !drop.has(t.id)) }));
      },

      reset: () => set({ clients: [], tombstones: [] }),
    }),
    {
      name: 'masterbook-clients',
      // Объединяем записи на диск: без этого каждый set() сериализует
      // весь стор (см. src/lib/persistStorage.ts).
      storage: coalescedStorage,
    },
  ),
);
