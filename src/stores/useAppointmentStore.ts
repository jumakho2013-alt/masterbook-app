import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Appointment, AppointmentStatus } from '@/src/types';
import { generateId } from '@/src/utils/helpers';
import { toDateKey } from '@/src/utils/date';

interface AppointmentState {
  appointments: Appointment[];

  addAppointment: (data: Omit<Appointment, 'id'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  setStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;
  getTodayAppointments: () => Appointment[];
  getByDate: (date: string) => Appointment[];
  getByClient: (clientId: string) => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      appointments: [],

      addAppointment: (data) => {
        const appointment: Appointment = { ...data, id: generateId() };
        set((s) => ({ appointments: [appointment, ...s.appointments] }));
        return appointment;
      },

      updateAppointment: (id, updates) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        })),

      setStatus: (id, status) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        })),

      deleteAppointment: (id) =>
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
        })),

      getTodayAppointments: () => {
        const todayKey = toDateKey(new Date());
        return get()
          .appointments.filter((a) => a.date === todayKey)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
      },

      getByDate: (date) =>
        get()
          .appointments.filter((a) => a.date === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),

      getByClient: (clientId) =>
        get()
          .appointments.filter((a) => a.clientId === clientId)
          .sort((a, b) => b.date.localeCompare(a.date)),
    }),
    {
      name: 'masterbook-appointments',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
