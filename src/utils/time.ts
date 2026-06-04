/**
 * Операции со временем формата "HH:MM".
 *
 * Единственный источник истины для логики слотов, длительностей и
 * «сколько сейчас минут от начала суток». Ранее три копии этого кода
 * жили в `app/appointment/new.tsx`, `app/appointment/[id].tsx` и
 * `app/(tabs)/index.tsx`; исправление одной копии забывало другие.
 *
 * Все функции принимают 24-часовой формат; секунды отбрасываются.
 */

/** Регулярка валидного 24-часового HH:MM. Используется в `src/lib/validation.ts` тоже. */
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** `"14:30"` → 14*60 + 30 = 870. Кидает для невалидного формата. */
export function timeToMinutes(time: string): number {
  if (!HHMM_RE.test(time)) {
    throw new RangeError(`Invalid time string: ${JSON.stringify(time)}`);
  }
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 870 → "14:30". Нормализует переполнение за сутки. */
export function minutesToTime(minutes: number): string {
  if (!Number.isFinite(minutes)) {
    throw new RangeError(`minutes must be finite, got ${minutes}`);
  }
  // Сбрасываем в [0, 1440). Пользователю не интересно «25:00» — это всегда
  // следующий день, а наша модель слотов не умеет пересекать полночь.
  const normalised = ((Math.trunc(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalised / 60);
  const m = normalised % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Добавить N минут к "HH:MM" и вернуть новое "HH:MM". */
export function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

/**
 * Сгенерировать тайм-слоты от `start` до `end` (не включая `end`) с шагом
 * `stepMin` минут. Используется в формах бронирования и в ре-скедулере.
 *
 * Возвращает пустой массив если `end <= start` или `stepMin <= 0` — так
 * UI безопасно отрендерит empty-state вместо падения.
 */
export function generateTimeSlots(start: string, end: string, stepMin: number): string[] {
  if (stepMin <= 0) return [];
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (endMin <= startMin) return [];
  const slots: string[] = [];
  for (let current = startMin; current < endMin; current += stepMin) {
    slots.push(minutesToTime(current));
  }
  return slots;
}

/**
 * Сколько минут прошло с 00:00 в указанной дате (по умолчанию — сейчас).
 * Пригождается чтобы спрятать прошедшие слоты в «сегодня».
 */
export function nowMinutesOfDay(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Пересекаются ли два интервала времени в пределах одного дня.
 * `[aStart, aEnd)` и `[bStart, bEnd)`. Используется в overlap-детекторе
 * слотов при бронировании.
 */
export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart);
}
