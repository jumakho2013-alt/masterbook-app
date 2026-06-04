import { useEffect, useState } from 'react';
import { File, Directory, Paths } from 'expo-file-system';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { captureException } from '@/src/lib/crashReporter';

/**
 * Облачная синхронизация фото (минус №13).
 *
 * Раньше в синк уходил локальный file:// URI — на другом устройстве он мёртв,
 * фото не восстанавливались. Теперь:
 *  - при сохранении фото заливаем в Supabase Storage и в поле photoUri/photos
 *    кладём STORAGE PATH (а не file://). Путь синкается как обычная строка —
 *    cloudSync менять не нужно (поля те же).
 *  - при отображении резолвим: если значение это локальный/обычный URI (есть
 *    схема ://) — показываем как есть; если это storage-path — качаем в кэш
 *    один раз и показываем локальную копию.
 *
 * Без аккаунта (local-only) аплоад пропускаем — храним локальный URI как раньше.
 * Старые фото с file:// остаются локальными (на новом устройстве не подтянутся,
 * но это поведение и было) — новые фото синкаются полноценно.
 */
const BUCKET = 'photos';
const CACHE_DIR_NAME = 'cloudphotos';

/** URI с реальной схемой (file://, content://, http(s)://) — показываем напрямую.
 *  Иначе это storage-path → надо резолвить. */
export function isDisplayableUri(value: string): boolean {
  return value.includes('://');
}

function extOf(uri: string): string {
  const clean = uri.split('?')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1) return 'jpg';
  const ext = clean.slice(dot + 1).toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'jpg';
}

let counter = 0;
function uniqueName(ext: string): string {
  counter += 1;
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function cacheDir(): Directory {
  const dir = new Directory(Paths.cache, CACHE_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function cacheFileFor(path: string): File {
  const safe = path.replace(/[^a-zA-Z0-9.]/g, '_');
  return new File(cacheDir(), safe);
}

/**
 * Залить локальный файл в Storage. Возвращает storage-path или null
 * (нет аккаунта / ошибка — тогда вызывающий оставляет локальный URI).
 * folder — логическая папка внутри юзера, напр. `clients` или `appointments`.
 */
export async function uploadPhoto(localUri: string, folder: string): Promise<string | null> {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null; // local-only режим — облака нет

    const ext = extOf(localUri);
    const path = `${userId}/${folder}/${uniqueName(ext)}`;
    const bytes = await new File(localUri).bytes();

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg',
      upsert: false,
    });
    if (error) {
      captureException(error, { tag: 'photoCloud.upload' });
      return null;
    }

    // Засеваем кэш локальной копией — на этом устройстве резолвер сразу покажет
    // фото без повторной загрузки из сети.
    try {
      const cf = cacheFileFor(path);
      if (cf.exists) cf.delete();
      new File(localUri).copy(cf);
    } catch {
      /* засев кэша best-effort — не критично */
    }

    return path;
  } catch (err) {
    captureException(err, { tag: 'photoCloud.upload' });
    return null;
  }
}

// Дедупликация одновременных резолвов одного path — в списках один и тот же
// клиент может рендериться в нескольких Avatar сразу; без этого две загрузки
// писали бы в один кэш-файл наперегонки (риск битой копии).
const inflight = new Map<string, Promise<string | null>>();

/** Резолвит storage-path в локальный URI (качает в кэш один раз). null при ошибке. */
export function resolvePhotoPath(path: string): Promise<string | null> {
  const existing = inflight.get(path);
  if (existing) return existing;

  const job = (async (): Promise<string | null> => {
    try {
      const cf = cacheFileFor(path);
      if (cf.exists && (cf.size ?? 0) > 0) return cf.uri;

      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 120);
      if (error || !data?.signedUrl) {
        if (error) captureException(error, { tag: 'photoCloud.sign' });
        return null;
      }

      if (cf.exists) cf.delete(); // на случай частичной/битой копии
      const downloaded = await File.downloadFileAsync(data.signedUrl, cf);
      return downloaded.uri;
    } catch (err) {
      captureException(err, { tag: 'photoCloud.resolve' });
      return null;
    }
  })().finally(() => inflight.delete(path));

  inflight.set(path, job);
  return job;
}

/**
 * Хук: превращает сохранённое значение (локальный URI или storage-path) в
 * готовый к показу URI. Локальный — сразу; path — после загрузки (до этого
 * undefined, вызывающий показывает плейсхолдер).
 */
export function useResolvedPhoto(value?: string | null): string | undefined {
  const initial = value && isDisplayableUri(value) ? value : undefined;
  const [uri, setUri] = useState<string | undefined>(initial);

  useEffect(() => {
    let alive = true;
    if (!value) {
      setUri(undefined);
      return;
    }
    if (isDisplayableUri(value)) {
      setUri(value);
      return;
    }
    // storage-path → резолвим асинхронно
    setUri(undefined);
    resolvePhotoPath(value).then((u) => {
      if (alive && u) setUri(u);
    });
    return () => {
      alive = false;
    };
  }, [value]);

  return uri;
}
