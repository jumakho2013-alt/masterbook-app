import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ru, enUS, type Locale } from 'date-fns/locale';

// Активная date-fns локаль — следует за языком приложения. Устанавливается
// из i18n.applyLanguage(). По умолчанию русская (CIS-first).
let activeLocale: Locale = ru;
let activeLang: 'ru' | 'en' = 'ru';

// Относительные слова держим прямо тут (без импорта i18n) — иначе цикл
// импортов date ↔ i18n (i18n зовёт setDateLocale).
const RELATIVE: Record<'ru' | 'en', { today: string; tomorrow: string; yesterday: string }> = {
  ru: { today: 'Сегодня', tomorrow: 'Завтра', yesterday: 'Вчера' },
  en: { today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday' },
};

/** Переключить локаль форматирования дат (месяцы/дни недели/«2 дня назад»).
 *  Вызывается из src/i18n/index.ts при смене языка. */
export function setDateLocale(lang: 'ru' | 'en'): void {
  activeLang = lang;
  activeLocale = lang === 'en' ? enUS : ru;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return RELATIVE[activeLang].today;
  if (isTomorrow(d)) return RELATIVE[activeLang].tomorrow;
  if (isYesterday(d)) return RELATIVE[activeLang].yesterday;
  return format(d, 'd MMMM', { locale: activeLocale });
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEE, d MMMM', { locale: activeLocale });
}

export function formatTime(time: string): string {
  return time; // already "14:00" format
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} — ${end}`;
}

export function daysSince(date: string): string {
  return formatDistanceToNow(new Date(date), { locale: activeLocale, addSuffix: true });
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
  return format(date, 'EE', { locale: activeLocale });
}

export function getDayNumber(date: Date): string {
  return format(date, 'd');
}

export function getMonthName(date: Date): string {
  return format(date, 'LLLL', { locale: activeLocale });
}
