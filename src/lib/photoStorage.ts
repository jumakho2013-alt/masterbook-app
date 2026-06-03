import { File, Directory, Paths } from 'expo-file-system';
import { captureException } from '@/src/lib/crashReporter';

/**
 * Перенос выбранного фото в постоянную папку приложения (минус №12).
 *
 * expo-image-picker возвращает URI во временной/кэш-директории. После очистки
 * кэша системой (или самим пользователем) такие файлы пропадают → в карточке
 * клиента/записи «битая» картинка. Поэтому копируем выбранный файл в
 * documentDirectory (он не чистится системой) и храним уже постоянный URI.
 *
 * Грейсфул-фолбэк: при любой ошибке копирования возвращаем исходный URI —
 * лучше временный путь, чем потеря возможности прикрепить фото вовсе.
 */
const PHOTOS_DIR_NAME = 'photos';

let counter = 0;
function uniqueName(ext: string): string {
  counter += 1;
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function extentionOf(uri: string): string {
  const clean = uri.split('?')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1) return 'jpg';
  const ext = clean.slice(dot + 1).toLowerCase();
  // защита от мусора в «расширении»
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'jpg';
}

export function persistImageToAppDir(srcUri: string): string {
  try {
    // Уже в постоянной папке — копировать незачем (идемпотентность при ре-сейве).
    if (srcUri.startsWith(Paths.document.uri)) return srcUri;

    const dir = new Directory(Paths.document, PHOTOS_DIR_NAME);
    if (!dir.exists) dir.create({ intermediates: true });

    const dest = new File(dir, uniqueName(extentionOf(srcUri)));
    const src = new File(srcUri);
    src.copy(dest);
    return dest.uri;
  } catch (err) {
    captureException(err, { tag: 'photoStorage.persist' });
    return srcUri; // фолбэк — временный uri лучше, чем падение
  }
}

/** Удалить файл из постоянной папки (например при удалении фото записи).
 *  Безопасно для не-наших uri (тогда no-op). */
export function deletePersistedImage(uri: string): void {
  try {
    if (!uri.startsWith(Paths.document.uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (err) {
    captureException(err, { tag: 'photoStorage.delete' });
  }
}
