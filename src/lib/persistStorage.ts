import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { captureException } from '@/src/lib/crashReporter';

/**
 * Хранилище для zustand/persist с объединением записей.
 *
 * zustand вызывает setItem на КАЖДЫЙ set() и сериализует стор целиком. У
 * активного мастера это ~1 МБ JSON: один тап «завершить запись» = запись в
 * appointments + запись в finances = две полные сериализации подряд, десятки
 * мс блокировки JS-потока. Импорт 200 контактов делал 200 таких записей —
 * секунды замороженного интерфейса.
 *
 * Здесь последняя запись по ключу побеждает, а фактический сброс на диск
 * откладывается на COALESCE_MS. Данные при этом не теряются:
 *  - в памяти стор уже актуален, persist нужен только для перезапуска;
 *  - при уходе приложения в фон делаем немедленный flush (см. flushPersist).
 */
const COALESCE_MS = 400;

const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flushNow(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pending.size === 0) return;
  const batch = [...pending.entries()];
  pending.clear();
  try {
    // multiSet — один переход через мост вместо N.
    await AsyncStorage.multiSet(batch);
  } catch (err) {
    // Возвращаем в очередь, чтобы не потерять при следующем flush.
    for (const [k, v] of batch) if (!pending.has(k)) pending.set(k, v);
    captureException(err, { tag: 'persistStorage.flush' });
  }
}

/** Немедленно сбросить отложенные записи (перед уходом в фон / выходом). */
export function flushPersist(): Promise<void> {
  return flushNow();
}

export const coalescedStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    // Читаем из очереди, если запись ещё не долетела до диска.
    const queued = pending.get(name);
    if (queued !== undefined) return queued;
    return AsyncStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    pending.set(name, value);
    if (!timer) timer = setTimeout(() => void flushNow(), COALESCE_MS);
  },
  removeItem: async (name: string) => {
    pending.delete(name);
    await AsyncStorage.removeItem(name);
  },
}));
