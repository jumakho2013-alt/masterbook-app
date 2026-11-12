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

/** Пункт меню: подпись + точный id специализации. Раньше пункты были голым
 *  текстом и уходили в каталог как ?q=«Маникюр», а q ищет по ИМЕНИ мастера —
 *  каждый пункт меню вёл на пустую выдачу. */
export type MenuItem = { label: string; spec: string };

/** Выпадающий список у поиска: «где искать». Первый пункт — без фильтра. */
export const SEARCH_SPECS: MenuItem[] = [
  { label: 'Все направления', spec: '' },
  { label: 'Маникюр и педикюр', spec: 'nails' },
  { label: 'Парикмахер, барбер', spec: 'hair' },
  { label: 'Брови', spec: 'brows' },
  { label: 'Ресницы', spec: 'lashes' },
  { label: 'Косметолог', spec: 'cosmetology' },
  { label: 'Визажист', spec: 'makeup' },
  { label: 'Массаж', spec: 'massage' },
  { label: 'Репетитор', spec: 'tutor' },
  { label: 'Клининг', spec: 'cleaning' },
];

/** Группы для мега-меню «Все услуги». */
export const MEGA_GROUPS: { group: string; items: MenuItem[] }[] = [
  { group: 'Ногти и волосы', items: [
    { label: 'Маникюр', spec: 'nails' }, { label: 'Педикюр', spec: 'nails' },
    { label: 'Парикмахер', spec: 'hair' }, { label: 'Барбер', spec: 'hair' },
  ] },
  { group: 'Лицо', items: [
    { label: 'Брови', spec: 'brows' }, { label: 'Ресницы', spec: 'lashes' },
    { label: 'Визажист', spec: 'makeup' }, { label: 'Косметолог', spec: 'cosmetology' },
  ] },
  { group: 'Тело и здоровье', items: [
    { label: 'Массаж', spec: 'massage' }, { label: 'Депиляция', spec: 'depilation' },
    { label: 'Психолог', spec: 'psychologist' }, { label: 'Нутрициолог', spec: 'nutritionist' },
  ] },
  { group: 'Дом и ремонт', items: [
    { label: 'Клининг', spec: 'cleaning' }, { label: 'Мастер на час', spec: 'handyman' },
    { label: 'Сантехник', spec: 'plumber' }, { label: 'Электрик', spec: 'electrician' },
  ] },
  { group: 'Обучение и праздники', items: [
    { label: 'Репетитор', spec: 'tutor' }, { label: 'Тренер', spec: 'trainer' },
    { label: 'Фотограф', spec: 'photographer' }, { label: 'Торты на заказ', spec: 'cakes' },
  ] },
];

/**
 * Свободный текст из поиска → специализация, если он про услугу.
 * Люди пишут «барбер», «ногти», «шугаринг», а не id. Без этого поиск по
 * услуге искал мастеров с таким ИМЕНЕМ и ничего не находил.
 */
const SPEC_SYNONYMS: [RegExp, string][] = [
  [/маник|педик|ногт|ноготь|гель-?лак|nail/i, 'nails'],
  [/барбер|стриж|парикм|окраш|уклад|волос|barber/i, 'hair'],
  [/бров|ламинир/i, 'brows'],
  [/ресниц|наращ.*ресн/i, 'lashes'],
  [/космет|чистк|пилинг|лиц[оа]/i, 'cosmetology'],
  [/визаж|макияж|make-?up/i, 'makeup'],
  [/массаж/i, 'massage'],
  [/шугар|депил|эпил|воск/i, 'depilation'],
  [/репетит|английск|математ|подготов|урок/i, 'tutor'],
  [/уборк|клининг|мойк.*окон/i, 'cleaning'],
  [/тату/i, 'tattoo'],
  [/психолог/i, 'psychologist'],
  [/фотограф|фотосесс/i, 'photographer'],
];

export function specFromQuery(q: string): string | undefined {
  const t = q.trim();
  if (t.length < 3) return undefined;
  return SPEC_SYNONYMS.find(([re]) => re.test(t))?.[1];
}

/** Ссылка в каталог. `spec` — id специализации (точный фильтр),
 *  `q` — свободный поиск (по имени и району; текст про услугу каталог сам
 *  переводит в spec через specFromQuery). */
export function catalogHref(opts?: { spec?: string; q?: string; city?: string }): string {
  const sp = new URLSearchParams();
  if (opts?.spec) sp.set('spec', opts.spec);
  if (opts?.q) sp.set('q', opts.q);
  if (opts?.city) sp.set('city', opts.city);
  const s = sp.toString();
  return s ? `/catalog?${s}` : '/catalog';
}
