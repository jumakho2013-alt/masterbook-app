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

export const SPECIALIZATION_LABELS: Record<string, string> = {
  // beauty
  nails: 'Маникюр', hair: 'Парикмахер', lashes: 'Ресницы', brows: 'Брови',
  cosmetology: 'Косметолог', makeup: 'Визажист', depilation: 'Депиляция / Шугаринг',
  tattoo: 'Тату-мастер', stylist: 'Стилист',
  // health
  massage: 'Массажист', psychologist: 'Психолог', osteopath: 'Остеопат',
  nutritionist: 'Нутрициолог', speech: 'Логопед',
  // repair
  electrician: 'Электрик', plumber: 'Сантехник', handyman: 'Мастер по ремонту',
  furniture: 'Сборка мебели', ac_repair: 'Кондиционеры', locksmith: 'Замки и двери',
  painter: 'Маляр', tiler: 'Плиточник',
  // education
  tutor: 'Репетитор', trainer: 'Тренер', instructor: 'Инструктор', coach: 'Коуч',
  music_teacher: 'Учитель музыки', dance: 'Танцы',
  // photo
  photographer: 'Фотограф', videographer: 'Видеограф', designer: 'Дизайнер',
  smm: 'SMM-специалист', target: 'Таргетолог',
  // auto
  mechanic: 'Автомастер', detailing: 'Детейлинг', carwash: 'Автомойка',
  tinting: 'Тонировка', tire: 'Шиномонтаж',
  // home
  cleaning: 'Клининг', nanny: 'Няня', gardener: 'Садовник', cook: 'Повар на дом',
  moving: 'Грузоперевозки',
  // pets
  groomer: 'Грумер', dog_trainer: 'Кинолог', pet_sitter: 'Передержка', vet: 'Ветеринар',
  // events
  host: 'Ведущий', animator: 'Аниматор', dj: 'DJ', decorator: 'Декоратор',
  baker: 'Торты на заказ',
  // handmade
  cakes: 'Торты на заказ', baking: 'Домашняя выпечка', candles: 'Свечи / мыло',
  florist: 'Флорист / букеты', knitting: 'Вязание / шитьё', jewelry: 'Украшения',
  pottery: 'Керамика', resin: 'Эпоксидная смола',
  // other
  custom: 'Мастер',
};

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
