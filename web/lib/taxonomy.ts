// Единая таксономия профессий — ЗЕРКАЛО приложения (src/data/professions.ts,
// src/types/profession.ts).
//
// Приложение пишет в БД идентификаторы (`profession_category` = 'beauty',
// `specialization_id` = 'nails'), а сайт раньше фильтровал по РУССКИМ словам
// через `profession_category.ilike.%Маникюр%` — совпадений не было никогда,
// поэтому мастера из приложения не находились ни по одному фильтру каталога,
// а на карточке буквально печаталось «beauty».
//
// Правило: в БД хранятся ТОЛЬКО id, человекочитаемые названия берутся отсюда.

export const CATEGORY_LABELS: Record<string, string> = {
  beauty: 'Красота',
  health: 'Здоровье',
  repair: 'Ремонт и сервис',
  education: 'Образование',
  photo: 'Фото и креатив',
  auto: 'Авто',
  home: 'Дом и быт',
  pets: 'Питомцы',
  events: 'Праздники',
  handmade: 'Хендмейд и еда',
  other: 'Другое',
};

/** Специализации по категориям — зеркало src/data/professions.ts.
 *  Отсюда выводятся и подписи, и категория для записи в profiles. */
export const SPECIALIZATION_GROUPS: { category: string; items: { id: string; label: string }[] }[] = [
  { category: 'beauty', items: [
    { id: 'nails', label: 'Маникюр' },
    { id: 'hair', label: 'Парикмахер' },
    { id: 'lashes', label: 'Ресницы' },
    { id: 'brows', label: 'Брови' },
    { id: 'cosmetology', label: 'Косметолог' },
    { id: 'makeup', label: 'Визажист' },
    { id: 'depilation', label: 'Депиляция / Шугаринг' },
    { id: 'tattoo', label: 'Тату-мастер' },
    { id: 'stylist', label: 'Стилист' },
  ] },
  { category: 'health', items: [
    { id: 'massage', label: 'Массажист' },
    { id: 'psychologist', label: 'Психолог' },
    { id: 'osteopath', label: 'Остеопат' },
    { id: 'nutritionist', label: 'Нутрициолог' },
    { id: 'speech', label: 'Логопед' },
  ] },
  { category: 'repair', items: [
    { id: 'electrician', label: 'Электрик' },
    { id: 'plumber', label: 'Сантехник' },
    { id: 'handyman', label: 'Мастер по ремонту' },
    { id: 'furniture', label: 'Сборка мебели' },
    { id: 'ac_repair', label: 'Кондиционеры' },
    { id: 'locksmith', label: 'Замки и двери' },
    { id: 'painter', label: 'Маляр' },
    { id: 'tiler', label: 'Плиточник' },
  ] },
  { category: 'education', items: [
    { id: 'tutor', label: 'Репетитор' },
    { id: 'trainer', label: 'Тренер' },
    { id: 'instructor', label: 'Инструктор' },
    { id: 'coach', label: 'Коуч' },
    { id: 'music_teacher', label: 'Учитель музыки' },
    { id: 'dance', label: 'Танцы' },
  ] },
  { category: 'photo', items: [
    { id: 'photographer', label: 'Фотограф' },
    { id: 'videographer', label: 'Видеограф' },
    { id: 'designer', label: 'Дизайнер' },
    { id: 'smm', label: 'SMM-специалист' },
    { id: 'target', label: 'Таргетолог' },
  ] },
  { category: 'auto', items: [
    { id: 'mechanic', label: 'Автомастер' },
    { id: 'detailing', label: 'Детейлинг' },
    { id: 'carwash', label: 'Автомойка' },
    { id: 'tinting', label: 'Тонировка' },
    { id: 'tire', label: 'Шиномонтаж' },
  ] },
  { category: 'home', items: [
    { id: 'cleaning', label: 'Клининг' },
    { id: 'nanny', label: 'Няня' },
    { id: 'gardener', label: 'Садовник' },
    { id: 'cook', label: 'Повар на дом' },
    { id: 'moving', label: 'Грузоперевозки' },
  ] },
  { category: 'pets', items: [
    { id: 'groomer', label: 'Грумер' },
    { id: 'dog_trainer', label: 'Кинолог' },
    { id: 'pet_sitter', label: 'Передержка' },
    { id: 'vet', label: 'Ветеринар' },
  ] },
  { category: 'events', items: [
    { id: 'host', label: 'Ведущий' },
    { id: 'animator', label: 'Аниматор' },
    { id: 'dj', label: 'DJ' },
    { id: 'decorator', label: 'Декоратор' },
    { id: 'baker', label: 'Торты на заказ' },
  ] },
  { category: 'handmade', items: [
    { id: 'cakes', label: 'Торты на заказ' },
    { id: 'baking', label: 'Домашняя выпечка' },
    { id: 'candles', label: 'Свечи / мыло' },
    { id: 'florist', label: 'Флорист / букеты' },
    { id: 'knitting', label: 'Вязание / шитьё' },
    { id: 'jewelry', label: 'Украшения' },
    { id: 'pottery', label: 'Керамика' },
    { id: 'resin', label: 'Эпоксидная смола' },
  ] },
  { category: 'other', items: [
    { id: 'custom', label: 'Мастер' },
  ] },
];

export const SPECIALIZATION_LABELS: Record<string, string> = Object.fromEntries(
  SPECIALIZATION_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.label])),
);

/** Категория специализации. Пишется в profiles.profession_category вместе со
 *  specialization_id — каталог фильтрует по второму, карточка падает на первое. */
export const SPECIALIZATION_CATEGORY: Record<string, string> = Object.fromEntries(
  SPECIALIZATION_GROUPS.flatMap((g) => g.items.map((i) => [i.id, g.category])),
);

/**
 * Что показать пользователю вместо сырых id. Приоритет — специализация
 * («Маникюр»), затем категория («Красота»). Старые записи, где в колонке лежит
 * уже русский текст (их писал веб-кабинет до унификации), отдаём как есть.
 */
export function professionLabel(
  specializationId?: string | null,
  categoryId?: string | null,
  fallback = 'Мастер',
): string {
  if (specializationId && SPECIALIZATION_LABELS[specializationId]) {
    return SPECIALIZATION_LABELS[specializationId];
  }
  if (categoryId) {
    if (CATEGORY_LABELS[categoryId]) return CATEGORY_LABELS[categoryId];
    // не наш id → это легаси-значение, введённое текстом
    if (!/^[a-z_]+$/.test(categoryId)) return categoryId;
  }
  return fallback;
}

/** Категории для селекта в кабинете: пишем id, показываем русское название. */
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }));
