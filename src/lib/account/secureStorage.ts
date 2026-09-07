import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Supabase storage-адаптер для AsyncStorage-подобного интерфейса,
 * использующий SecureStore на Android (Encrypted SharedPreferences, AES-256)
 * и iOS Keychain через SecureStore на iOS.
 *
 * На iOS `AsyncStorage` уже хранится в Keychain-wrapped контейнере, но:
 *   - Явный `SecureStore` использует `kSecAttrAccessibleAfterFirstUnlock`
 *     → после разблокировки устройства, Supabase session доступна только
 *     этому приложению. Это строже чем дефолт AsyncStorage.
 *   - Единая обёртка на обе платформы — меньше ветвлений в коде.
 *
 * ОГРАНИЧЕНИЕ SecureStore: на Android значение ≤ 2048 байт (Android
 * KeyStore). Supabase session JSON (access + refresh tokens + user) обычно
 * 1.5–2.5КБ. Поэтому режем на чанки по 1.5КБ и складываем как
 * `key:0`, `key:1`, …, а в основном `key` держим количество чанков.
 */

const CHUNK_KEY = '__chunks__';
const CHUNK_SIZE = 1536;

// На web (например dev через Expo for Web) SecureStore не работает —
// fall back на AsyncStorage. Это OK для dev, в production web-таргета нет.
const secureStoreAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

function indexKey(key: string): string {
  return `${key}:${CHUNK_KEY}`;
}

function chunkKey(key: string, index: number): string {
  return `${key}:${index}`;
}

async function setItemSecure(key: string, value: string): Promise<void> {
  // Убираем возможные старые чанки перед записью новых (чтобы не остались
  // хвосты после укорачивающей записи).
  await deleteItemSecure(key);

  if (value.length <= CHUNK_SIZE) {
    // Маленькое значение — пишем напрямую, без индекса чанков.
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
    chunks.push(value.slice(offset, offset + CHUNK_SIZE));
  }
  // Индекс — сколько чанков читать — храним в отдельном ключе.
  await SecureStore.setItemAsync(indexKey(key), String(chunks.length));
  await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c)));
}

async function getItemSecure(key: string): Promise<string | null> {
  const single = await SecureStore.getItemAsync(key);
  if (single !== null) return single;

  const indexStr = await SecureStore.getItemAsync(indexKey(key));
  if (!indexStr) return null;

  const count = Number(indexStr);
  if (!Number.isFinite(count) || count <= 0) return null;

  const chunks = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
  );
  if (chunks.some((c) => c === null)) {
    // Повреждение — удаляем всё, пусть Supabase считает сессию просроченной.
    await deleteItemSecure(key);
    return null;
  }
  return chunks.join('');
}

async function deleteItemSecure(key: string): Promise<void> {
  const indexStr = await SecureStore.getItemAsync(indexKey(key));
  if (indexStr) {
    const count = Number(indexStr) || 0;
    await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
    );
    await SecureStore.deleteItemAsync(indexKey(key));
  }
  await SecureStore.deleteItemAsync(key);
}

/**
 * Минимальный интерфейс как у AsyncStorage — достаточно для Supabase
 * (использует только getItem / setItem / removeItem).
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!secureStoreAvailable) return AsyncStorage.getItem(key);
    try {
      return await getItemSecure(key);
    } catch {
      // SecureStore может недоступен (rare) — fallback, чтобы пользователь
      // хотя бы мог войти.
      return AsyncStorage.getItem(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (!secureStoreAvailable) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    try {
      await setItemSecure(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (!secureStoreAvailable) {
      await AsyncStorage.removeItem(key);
      return;
    }
    try {
      await deleteItemSecure(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};
