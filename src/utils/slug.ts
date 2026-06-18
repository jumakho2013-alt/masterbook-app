import { generateId } from '@/src/utils/helpers';

// Транслитерация кириллицы → латиница для slug публичной страницы мастера
// (masterbook.tj/<slug>). Покрывает RU + распространённые символы.
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function transliterate(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join('');
}

/** Базовый slug из имени: латиница, через дефис, только [a-z0-9-]. */
export function slugifyName(name: string): string {
  return transliterate(name.trim())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Уникальный slug для публикации. База из имени + короткий суффикс из
 * generateId() — гарантирует уникальность без round-trip к серверу и без
 * гонки (unique-индекс idx_profiles_slug всё равно подстрахует). Пустое имя →
 * fallback 'master'.
 */
export function makeSlug(name: string): string {
  const base = slugifyName(name) || 'master';
  const suffix = generateId().slice(-4).replace(/[^a-z0-9]/gi, '0').toLowerCase();
  return `${base}-${suffix}`;
}
