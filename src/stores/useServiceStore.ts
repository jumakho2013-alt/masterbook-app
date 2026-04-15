import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Service } from '@/src/types';
import { generateId } from '@/src/utils/helpers';
import { serviceTemplates } from '@/src/data/service-templates';

interface ServiceState {
  services: Service[];

  addService: (data: Omit<Service, 'id'>) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  getService: (id: string) => Service | undefined;
  loadTemplates: (specializationId: string) => void;
}

export const useServiceStore = create<ServiceState>()(
  persist(
    (set, get) => ({
      services: [],

      addService: (data) => {
        const service: Service = { ...data, id: generateId() };
        set((s) => ({ services: [...s.services, service] }));
        return service;
      },

      updateService: (id, updates) =>
        set((s) => ({
          services: s.services.map((sv) =>
            sv.id === id ? { ...sv, ...updates } : sv,
          ),
        })),

      deleteService: (id) =>
        set((s) => ({ services: s.services.filter((sv) => sv.id !== id) })),

      getService: (id) => get().services.find((sv) => sv.id === id),

      loadTemplates: (specializationId) => {
        const templates = serviceTemplates[specializationId] ?? [];
        const services: Service[] = templates.map((t) => ({
          ...t,
          id: generateId(),
        }));
        set({ services });
      },
    }),
    {
      name: 'masterbook-services',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
