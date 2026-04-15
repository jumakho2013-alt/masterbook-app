import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Client } from '@/src/types';
import { generateId } from '@/src/utils/helpers';

const FREE_CLIENT_LIMIT = 20;

interface ClientState {
  clients: Client[];

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client | null;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  canAddClient: () => boolean;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      clients: [],

      addClient: (data) => {
        if (!get().canAddClient()) return null;
        const client: Client = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ clients: [client, ...s.clients] }));
        return client;
      },

      updateClient: (id, updates) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

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

      canAddClient: () => get().clients.length < FREE_CLIENT_LIMIT,
    }),
    {
      name: 'masterbook-clients',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
