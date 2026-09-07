import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Клиент-сайд throttle для auth-попыток. Не заменяет серверную защиту
 * (её обеспечивает Supabase), но:
 *   1. Снижает расход попыток у пользователя который промахивается по
 *      клавишам — даёт мягкий рост задержки вместо жёсткого lock-out от
 *      Supabase (который блокирует на уровне IP).
 *   2. Делает UI-feedback понятным: «подождите N секунд» вместо ловушки
 *      «Too many requests» от бэкенда без контекста.
 *
 * Храним в AsyncStorage — state переживает перезапуск приложения,
 * злоумышленник не может сбросить таймер через swipe из app switcher.
 */

const STORAGE_KEY = 'masterbook-auth-attempts';
const WINDOW_MS = 10 * 60 * 1000; // 10 минут
const MAX_ATTEMPTS = 5;
const BASE_COOLDOWN_MS = 15 * 1000; // 15 сек после 5-й неудачи, × 2 за каждую следующую

interface AttemptsState {
  failures: number[]; // timestamps ms
  lockedUntil?: number; // timestamp ms
}

async function read(): Promise<AttemptsState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { failures: [] };
  try {
    const parsed = JSON.parse(raw) as AttemptsState;
    return {
      failures: parsed.failures ?? [],
      lockedUntil: parsed.lockedUntil,
    };
  } catch {
    return { failures: [] };
  }
}

async function write(state: AttemptsState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function cleanWindow(failures: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return failures.filter((t) => t > cutoff);
}

export interface RateLimitStatus {
  locked: boolean;
  /** Миллисекунды до снятия блокировки; 0 если не залочено. */
  retryInMs: number;
  /** Сколько ещё попыток разрешено в текущем окне. */
  attemptsLeft: number;
}

export async function checkAuthRateLimit(): Promise<RateLimitStatus> {
  const state = await read();
  const now = Date.now();
  if (state.lockedUntil && state.lockedUntil > now) {
    return { locked: true, retryInMs: state.lockedUntil - now, attemptsLeft: 0 };
  }
  const recent = cleanWindow(state.failures);
  return {
    locked: false,
    retryInMs: 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - recent.length),
  };
}

/**
 * Позвать после НЕУДАЧНОЙ попытки авторизации. Возвращает новый статус.
 * После MAX_ATTEMPTS подряд накладывает cooldown с экспоненциальным ростом
 * (15с → 30с → 60с …) — медленно эскалирует, но не блокирует навсегда.
 */
export async function recordAuthFailure(): Promise<RateLimitStatus> {
  const state = await read();
  const now = Date.now();
  const recent = cleanWindow(state.failures);
  recent.push(now);

  let lockedUntil: number | undefined;
  // Считаем «стрики» сверх лимита — за каждый превышающий failure удваиваем
  // cooldown. Страхует от автомата, но неудачная 10-я попытка ручного
  // набора ждёт 16 минут вместо 15 секунд — приемлемо.
  const overLimit = recent.length - MAX_ATTEMPTS;
  if (overLimit >= 0) {
    const cooldown = BASE_COOLDOWN_MS * Math.pow(2, overLimit);
    lockedUntil = now + cooldown;
  }

  await write({ failures: recent, lockedUntil });

  return {
    locked: lockedUntil !== undefined,
    retryInMs: lockedUntil ? lockedUntil - now : 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - recent.length),
  };
}

/**
 * Позвать после УСПЕШНОЙ авторизации — чистим историю.
 */
export async function resetAuthRateLimit(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function formatRetryDuration(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return `${totalSec} сек`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (sec === 0) return `${min} мин`;
  return `${min} мин ${sec} сек`;
}
