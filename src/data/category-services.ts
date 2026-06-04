import type { Service } from '@/src/types';

/**
 * Примерные услуги по КАТЕГОРИИ профессии. Используются как стартовый набор
 * при онбординге, если для конкретной специализации нет своего шаблона.
 *
 * Цель (из фидбэка): сантехник/репетитор/фотограф не должны видеть маникюр.
 * Каждый получает релевантные примеры, которые легко отредактировать/удалить.
 *
 * Цены в RUB (дефолтная валюта), длительность в минутах. Это лишь примеры —
 * мастер сразу правит под себя. Названия пока RU (общий data-слой ещё не
 * локализован — см. отдельную задачу).
 */
type SeedService = Omit<Service, 'id'>;

const C = {
  beauty: '#2EE6A6',
  health: '#5AC8FA',
  repair: '#FF9F0A',
  education: '#7C5DFA',
  photo: '#FF6B9D',
  auto: '#64D2FF',
  home: '#30D158',
  pets: '#FFD60A',
  events: '#BF5AF2',
  handmade: '#FF8A65',
} as const;

export const CATEGORY_SERVICES: Record<string, SeedService[]> = {
  beauty: [
    { name: 'Маникюр', price: 1500, duration: 60, color: C.beauty },
    { name: 'Педикюр', price: 2000, duration: 90, color: C.beauty },
    { name: 'Стрижка', price: 1500, duration: 60, color: C.beauty },
    { name: 'Окрашивание', price: 4000, duration: 120, color: C.beauty },
    { name: 'Коррекция бровей', price: 800, duration: 30, color: C.beauty },
  ],
  health: [
    { name: 'Массаж спины', price: 2000, duration: 60, color: C.health },
    { name: 'Общий массаж', price: 3000, duration: 90, color: C.health },
    { name: 'Консультация', price: 2000, duration: 60, color: C.health },
    { name: 'Первичный приём', price: 2500, duration: 60, color: C.health },
  ],
  repair: [
    { name: 'Вызов мастера', price: 500, duration: 30, color: C.repair },
    { name: 'Диагностика', price: 500, duration: 30, color: C.repair },
    { name: 'Мелкий ремонт', price: 1500, duration: 60, color: C.repair },
    { name: 'Установка / замена', price: 2000, duration: 90, color: C.repair },
    { name: 'Работа за час', price: 1000, duration: 60, color: C.repair },
  ],
  education: [
    { name: 'Индивидуальное занятие', price: 1200, duration: 60, color: C.education },
    { name: 'Пробный урок', price: 500, duration: 45, color: C.education },
    { name: 'Групповое занятие', price: 800, duration: 60, color: C.education },
    { name: 'Подготовка к экзамену', price: 1800, duration: 90, color: C.education },
  ],
  photo: [
    { name: 'Фотосессия 1 час', price: 5000, duration: 60, color: C.photo },
    { name: 'Репортажная съёмка', price: 8000, duration: 120, color: C.photo },
    { name: 'Студийная съёмка', price: 6000, duration: 90, color: C.photo },
    { name: 'Обработка фото', price: 2000, duration: 60, color: C.photo },
  ],
  auto: [
    { name: 'Диагностика', price: 1000, duration: 60, color: C.auto },
    { name: 'Замена масла', price: 1500, duration: 45, color: C.auto },
    { name: 'Мойка кузова', price: 800, duration: 40, color: C.auto },
    { name: 'Детейлинг', price: 5000, duration: 180, color: C.auto },
  ],
  home: [
    { name: 'Уборка квартиры', price: 3000, duration: 180, color: C.home },
    { name: 'Генеральная уборка', price: 6000, duration: 300, color: C.home },
    { name: 'Мытьё окон', price: 1500, duration: 120, color: C.home },
    { name: 'Разовая услуга', price: 2000, duration: 120, color: C.home },
  ],
  pets: [
    { name: 'Стрижка собаки', price: 2500, duration: 90, color: C.pets },
    { name: 'Гигиеническая стрижка', price: 1500, duration: 60, color: C.pets },
    { name: 'Купание', price: 1200, duration: 60, color: C.pets },
    { name: 'Передержка (сутки)', price: 1000, duration: 60, color: C.pets },
  ],
  events: [
    { name: 'Ведение мероприятия', price: 15000, duration: 240, color: C.events },
    { name: 'Аниматор (1 час)', price: 5000, duration: 60, color: C.events },
    { name: 'Оформление', price: 10000, duration: 180, color: C.events },
    { name: 'DJ-сет', price: 12000, duration: 240, color: C.events },
  ],
  handmade: [
    { name: 'Торт на заказ', price: 3000, duration: 60, color: C.handmade },
    { name: 'Букет', price: 2500, duration: 30, color: C.handmade },
    { name: 'Изделие на заказ', price: 2000, duration: 60, color: C.handmade },
  ],
};

/** Примерные услуги для категории, или [] если категории нет в карте. */
export function getCategoryServices(categoryId: string | undefined): SeedService[] {
  if (!categoryId) return [];
  return CATEGORY_SERVICES[categoryId] ?? [];
}
