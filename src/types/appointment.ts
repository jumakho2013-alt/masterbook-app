export type AppointmentStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "14:00"
  endTime: string; // "15:30"
  status: AppointmentStatus;
  price: number;
  /** Предоплата/депозит за запись (сумма). undefined = не запрашивался.
   *  Списание с карты — отдельная фича (ЮKassa/СБП); пока ручной учёт. */
  deposit?: number;
  /** Депозит фактически получен (нал/перевод). Снижает риск no-show. */
  depositPaid?: boolean;
  notes?: string;
  address?: string;
  photos?: string[]; // URI локальных фото
  reminderNotificationId?: string; // id запланированного локального уведомления
  /** id события в системном календаре (iOS Calendar / Google Calendar)
   *  если включён calendar sync. null = не синхронизировано. */
  calendarEventId?: string;
  /** ISO момента последнего изменения — для last-write-wins при облачной
   *  синхронизации (см. src/lib/cloudSync.ts). */
  updatedAt?: string;
}
