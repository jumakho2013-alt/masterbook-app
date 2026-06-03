import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Service } from '@/src/types';
import { generateId } from '@/src/utils/helpers';
import { nowIso } from '@/src/utils/date';
import { serviceTemplates } from '@/src/data/service-templates';
import { mergeRemote, type RemoteChange, type Tombstone } from '@/src/lib/syncMerge';
import { notifyLocalMutation } from '@/src/lib/cloudSyncSignal';

interface ServiceState {
  services: Service[];
  tombstones: Tombstone[];

  addService: (data: Omit<Service, 'id'>) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  getService: (id: string) => Service | undefined;
  loadTemplates: (specializationId: string) => void;
  mergeRemote: (remote: RemoteChange<Service>[]) => string[];
  clearTombstones: (ids: string[]) => void;
  /** Полный сброс in-memory state (используется при signOut / deleteAccount) */
  reset: () => void;
}

export const useServiceStore = create<ServiceState>()(
  persist(
    (set, get) => ({
      services: [],
      tombstones: [],

      addService: (data) => {
        const service: Service = { ...data, id: generateId(), updatedAt: nowIso() };
        set((s) => ({ services: [...s.services, service] }));
        notifyLocalMutation();
        return service;
      },

      updateService: (id, updates) => {
        set((s) => ({
          services: s.services.map((sv) =>
            sv.id === id ? { ...sv, ...updates, updatedAt: nowIso() } : sv,
          ),
        }));
        notifyLocalMutation();
      },

      deleteService: (id) => {
        set((s) => ({
          services: s.services.filter((sv) => sv.id !== id),
          tombstones: [
            ...s.tombstones.filter((t) => t.id !== id),
            { id, deletedAt: nowIso() },
          ],
        }));
        notifyLocalMutation();
      },

      getService: (id) => get().services.find((sv) => sv.id === id),

      loadTemplates: (specializationId) => {
        const templates = serviceTemplates[specializationId] ?? [];
        const now = nowIso();
        const services: Service[] = templates.map((t) => ({
          ...t,
          id: generateId(),
          updatedAt: now,
        }));
        set({ services });
        notifyLocalMutation();
      },

      mergeRemote: (remote) => {
        const { records, appliedDeletes } = mergeRemote(get().services, remote);
        set({ services: records });
        return appliedDeletes;
      },

      clearTombstones: (ids) =>
        set((s) => ({ tombstones: s.tombstones.filter((t) => !ids.includes(t.id)) })),

      reset: () => set({ services: [], tombstones: [] }),
    }),
    {
      name: 'masterbook-services',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
