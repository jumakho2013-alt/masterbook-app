import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Appointment, AppointmentStatus } from '@/src/types';
import { generateId } from '@/src/utils/helpers';
import { toDateKey } from '@/src/utils/date';
import { cancelNotification } from '@/src/lib/notifications';

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

function cancelReminderSafely(id?: string) {
  if (!id) return;
  // fire-and-forget; silently swallow errors — the notification simply
  // won't be found if already delivered or the system denied permission.
  cancelNotification(id).catch(() => {});
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

      setStatus: (id, status) => {
        const prev = get().appointments.find((a) => a.id === id);
        // When the appointment leaves the "scheduled" state the pending
        // reminder becomes noise — cancel it.
        if (prev && status !== 'scheduled') {
          cancelReminderSafely(prev.reminderNotificationId);
        }
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  reminderNotificationId:
                    status === 'scheduled' ? a.reminderNotificationId : undefined,
                }
              : a,
          ),
        }));
      },

      deleteAppointment: (id) => {
        const prev = get().appointments.find((a) => a.id === id);
        cancelReminderSafely(prev?.reminderNotificationId);
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
        }));
      },

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
