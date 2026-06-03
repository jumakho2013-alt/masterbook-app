import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Appointment, AppointmentStatus } from '@/src/types';
import { generateId } from '@/src/utils/helpers';
import { toDateKey, nowIso } from '@/src/utils/date';
import { cancelNotification } from '@/src/lib/notifications';
import { mergeRemote, type RemoteChange, type Tombstone } from '@/src/lib/syncMerge';
import { notifyLocalMutation } from '@/src/lib/cloudSyncSignal';

interface AppointmentState {
  appointments: Appointment[];
  tombstones: Tombstone[];

  addAppointment: (data: Omit<Appointment, 'id'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  setStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;
  getTodayAppointments: () => Appointment[];
  getByDate: (date: string) => Appointment[];
  getByClient: (clientId: string) => Appointment[];
  mergeRemote: (remote: RemoteChange<Appointment>[]) => string[];
  clearTombstones: (ids: string[]) => void;
  /** Полный сброс in-memory state. Параллельно отменяет все локальные
   *  напоминания (иначе уведомления переживут logout). */
  reset: () => void;
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
      tombstones: [],

      addAppointment: (data) => {
        const appointment: Appointment = { ...data, id: generateId(), updatedAt: nowIso() };
        set((s) => ({ appointments: [appointment, ...s.appointments] }));
        notifyLocalMutation();
        return appointment;
      },

      updateAppointment: (id, updates) => {
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: nowIso() } : a,
          ),
        }));
        notifyLocalMutation();
      },

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
                  updatedAt: nowIso(),
                }
              : a,
          ),
        }));
        notifyLocalMutation();
      },

      deleteAppointment: (id) => {
        const prev = get().appointments.find((a) => a.id === id);
        cancelReminderSafely(prev?.reminderNotificationId);
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
          tombstones: [
            ...s.tombstones.filter((t) => t.id !== id),
            { id, deletedAt: nowIso() },
          ],
        }));
        notifyLocalMutation();
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

      mergeRemote: (remote) => {
        // reminderNotificationId и calendarEventId — device-local: они НЕ
        // синхронизируются (id уведомления/события валидны только на этом
        // устройстве). Серверная запись их не несёт, поэтому при перезаписи
        // локальной записи серверной мы бы их потеряли → уведомление осталось
        // бы запланированным, но без id его уже не отменить (orphan). Поэтому
        // переносим эти поля из предыдущей локальной копии.
        const prevById = new Map(get().appointments.map((a) => [a.id, a]));
        const { records, appliedDeletes } = mergeRemote(get().appointments, remote);
        const merged = records.map((r) => {
          const prev = prevById.get(r.id);
          if (!prev) return r;
          return {
            ...r,
            reminderNotificationId: r.reminderNotificationId ?? prev.reminderNotificationId,
            calendarEventId: r.calendarEventId ?? prev.calendarEventId,
          };
        });
        set({ appointments: merged });
        return appliedDeletes;
      },

      clearTombstones: (ids) =>
        set((s) => ({ tombstones: s.tombstones.filter((t) => !ids.includes(t.id)) })),

      reset: () => {
        // Отменяем все запланированные локальные напоминания. Без этого
        // уведомления продолжают приходить даже после logout — крайне
        // конфузно для следующего пользователя на устройстве.
        for (const a of get().appointments) {
          cancelReminderSafely(a.reminderNotificationId);
        }
        set({ appointments: [], tombstones: [] });
      },
    }),
    {
      name: 'masterbook-appointments',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
