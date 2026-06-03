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
  notes?: string;
  address?: string;
  photos?: string[]; // URI локальных фото
  reminderNotificationId?: string; // id запланированного локального уведомления
  /** id события в системном календаре (iOS Calendar / Google Calendar)
   *  если включён calendar sync. null = не синхронизировано. */
  calendarEventId?: string;
}
