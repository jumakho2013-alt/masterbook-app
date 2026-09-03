// Единый источник таксономии услуг: им пользуются шапка (мега-меню/поиск),
// карточки категорий на главной и подсчёт мастеров по категориям.
// Клик по категории ведёт в каталог с поиском по этому слову (?q=).

export type Category = { key: string; name: string; tone?: 'plum' | 'gold' | 'neutral' };

/** 8 карточек категорий на главной (как в дизайне).
 *  ВАЖНО: `key` — это реальный `specialization_id` из приложения
 *  (src/data/professions.ts), по нему и фильтруется каталог. Раньше ключи были
 *  выдуманные ('manicure', 'barber'), а фильтр искал русское слово в
 *  `profession_category` — не совпадало никогда. */
export const HOME_CATEGORIES: Category[] = [
  { key: 'nails', name: 'Маникюр' },
  { key: 'hair', name: 'Парикмахер' },
  { key: 'brows', name: 'Брови' },
  { key: 'lashes', name: 'Ресницы' },
  { key: 'cosmetology', name: 'Косметолог' },
  { key: 'massage', name: 'Массажист' },
  { key: 'tutor', name: 'Репетитор' },
  { key: 'cleaning', name: 'Клининг' },
];

/** Направления для выпадающего списка рядом с поиском. */
export const DIRECTIONS = [
  'Все направления',
  'Ногти и руки',
  'Волосы',
  'Брови и ресницы',
  'Лицо и тело',
  'Здоровье',
  'Дом и обучение',
];

/** Группы услуг для мега-меню «Все услуги». Без выдуманных счётчиков. */
export const MEGA_GROUPS: { group: string; items: string[] }[] = [
  { group: 'Ногти и руки', items: ['Маникюр', 'Педикюр', 'Наращивание ногтей', 'Дизайн ногтей'] },
  { group: 'Волосы', items: ['Барбер', 'Женская стрижка', 'Окрашивание', 'Укладка'] },
  { group: 'Брови и ресницы', items: ['Брови', 'Ламинирование бровей', 'Наращивание ресниц', 'Визаж'] },
  { group: 'Лицо и тело', items: ['Косметология', 'Чистка лица', 'Массаж', 'СПА-уход', 'Эпиляция'] },
  { group: 'Здоровье', items: ['Диетолог', 'Психолог', 'Стоматолог'] },
  { group: 'Дом и обучение', items: ['Уборка', 'Репетитор', 'Няня', 'Мастер на час'] },
];

/** Ссылка в каталог. `spec` — id специализации (точный фильтр),
 *  `q` — свободный поиск по имени мастера. */
export function catalogHref(opts?: { spec?: string; q?: string; city?: string }): string {
  const sp = new URLSearchParams();
  if (opts?.spec) sp.set('spec', opts.spec);
  if (opts?.q) sp.set('q', opts.q);
  if (opts?.city) sp.set('city', opts.city);
  const s = sp.toString();
  return s ? `/catalog?${s}` : '/catalog';
}
