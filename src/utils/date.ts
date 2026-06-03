import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return 'Сегодня';
  if (isTomorrow(d)) return 'Завтра';
  if (isYesterday(d)) return 'Вчера';
  return format(d, 'd MMMM', { locale: ru });
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE, d MMMM', { locale: ru });
}

export function formatTime(time: string): string {
  return time; // already "14:00" format
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} — ${end}`;
}

export function daysSince(date: string): string {
  return formatDistanceToNow(new Date(date), { locale: ru, addSuffix: true });
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Текущий момент в ISO (UTC). Единая точка — используется как updatedAt
 *  для облачной синхронизации (last-write-wins). */
export function nowIso(): string {
  return new Date().toISOString();
}

export function getDayOfWeekShort(date: Date): string {
  return format(date, 'EE', { locale: ru });
}

export function getDayNumber(date: Date): string {
  return format(date, 'd');
}

export function getMonthName(date: Date): string {
  return format(date, 'LLLL', { locale: ru });
}
