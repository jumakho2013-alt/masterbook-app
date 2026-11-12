// Адрес публичной страницы мастера: /m/<slug>. Логика повторяет приложение
// (src/utils/slug.ts), но транслит шире: рынок запуска — Таджикистан, и в
// именах мастеров встречаются ғ, қ, ҳ, ҷ, ӣ, ӯ. Без них «Ҷамшед» превращался бы
// в «-amshed», а «Қодирова» — в «odirova».

const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // таджикский
  ғ: 'gh', ӣ: 'i', қ: 'q', ӯ: 'u', ҳ: 'h', ҷ: 'j',
  // узбекский и казахский
  ў: 'u', ә: 'a', ө: 'o', ү: 'u', ұ: 'u', ң: 'ng', і: 'i',
};

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 34);
}

/** Уникальный адрес: основа из имени + 4 случайных символа. Коллизию всё равно
 *  ловит уникальный индекс idx_profiles_slug — тогда вызывающий пробует снова. */
export function makeSlug(name: string): string {
  const base = slugifyName(name) || 'master';
  const suffix = Math.random().toString(36).slice(2, 6).padEnd(4, '0');
  return `${base}-${suffix}`;
}

export function slugValid(s: string): boolean {
  return /^[a-z0-9-]{3,40}$/.test(s);
}
