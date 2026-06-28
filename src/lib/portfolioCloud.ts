import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { captureException } from '@/src/lib/crashReporter';

/**
 * Фото-портфолио мастера для сайта-каталога.
 *
 * В отличие от photoCloud (приватный бакет 'photos' + signed URL для фото
 * записей/клиентов), портфолио лежит в ПУБЛИЧНОМ бакете 'portfolio' и в
 * profiles.portfolio_photos хранится ПУБЛИЧНЫЙ URL — сайт показывает их прямым
 * <img src> без подписи. Путь всегда `{userId}/...` (RLS пускает писать только
 * в свою папку).
 */
const BUCKET = 'portfolio';

let counter = 0;
function uniqueName(): string {
  counter += 1;
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

/** Заливает локальное фото в публичный бакет. Возвращает публичный URL или null
 *  (нет аккаунта / ошибка). Любой вход нормализуется в JPEG ≤1280px: iOS отдаёт
 *  HEIC (браузеры его не рендерят), а полноразмерные кадры раздувают бакет. */
export async function uploadPortfolioPhoto(localUri: string): Promise<string | null> {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null; // публиковать портфолио можно только с аккаунтом

    let uri = localUri;
    try {
      const out = await manipulateAsync(localUri, [{ resize: { width: 1280 } }], {
        compress: 0.7,
        format: SaveFormat.JPEG,
      });
      uri = out.uri;
    } catch (err) {
      // Конвертация не вышла — заливаем оригинал как JPEG (лучше, чем потерять
      // фото). HEIC-кейс редок и логируется.
      captureException(err, { tag: 'portfolioCloud.manipulate' });
    }

    const path = `${userId}/${uniqueName()}`;
    const bytes = await new File(uri).bytes();

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) {
      captureException(error, { tag: 'portfolioCloud.upload' });
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (err) {
    captureException(err, { tag: 'portfolioCloud.upload' });
    return null;
  }
}

/** Удаляет фото из бакета по его публичному URL (best-effort — UI всё равно
 *  убирает URL из массива). */
export async function deletePortfolioPhoto(publicUrl: string): Promise<void> {
  try {
    const marker = `/object/public/${BUCKET}/`;
    const i = publicUrl.indexOf(marker);
    if (i === -1) return; // не наш URL — нечего удалять
    const path = decodeURIComponent(publicUrl.slice(i + marker.length));
    if (!path) return;
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) captureException(error, { tag: 'portfolioCloud.delete' });
  } catch (err) {
    captureException(err, { tag: 'portfolioCloud.delete' });
  }
}
