import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, startOfWeek, addDays } from 'date-fns';
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

/**
 * Сетка месяца для календарной решётки: ведущие null'ы для выравнивания по
 * понедельнику, затем все дни месяца. Неделя начинается с Пн (Мон-first).
 */
export function getMonthGrid(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // JS: 0=Вс. Нам нужен 0=Пн.
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const grid: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  return grid;
}

/** Локализованные короткие подписи дней недели, Пн→Вс (следуют за языком). */
export function getWeekdayShortLabels(): string[] {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), 'EEEEEE', { locale: activeLocale }),
  );
}
