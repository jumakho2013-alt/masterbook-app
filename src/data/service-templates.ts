import type { Service } from '@/src/types';

type ServiceTemplate = Omit<Service, 'id'>;

const serviceColors = [
  '#FF6B9D', '#4ECDC4', '#A78BFA', '#F59E0B',
  '#3B82F6', '#10B981', '#F472B6', '#8B5CF6',
];

function color(i: number) {
  return serviceColors[i % serviceColors.length];
}

export const serviceTemplates: Record<string, ServiceTemplate[]> = {
  // Beauty
  nails: [
    { name: 'Маникюр', price: 20, duration: 60, color: color(0) },
    { name: 'Покрытие гель-лак', price: 15, duration: 45, color: color(1) },
    { name: 'Маникюр + покрытие', price: 30, duration: 90, color: color(2) },
    { name: 'Педикюр', price: 25, duration: 75, color: color(3) },
    { name: 'Снятие покрытия', price: 5, duration: 20, color: color(4) },
  ],
  hair: [
    { name: 'Стрижка женская', price: 30, duration: 60, color: color(0) },
    { name: 'Стрижка мужская', price: 15, duration: 30, color: color(1) },
    { name: 'Окрашивание', price: 50, duration: 180, color: color(2) },
    { name: 'Укладка', price: 20, duration: 45, color: color(3) },
    { name: 'Кератин', price: 80, duration: 180, color: color(4) },
  ],
  lashes: [
    { name: 'Наращивание классика', price: 30, duration: 120, color: color(0) },
    { name: 'Наращивание 2D', price: 35, duration: 150, color: color(1) },
    { name: 'Наращивание объём', price: 40, duration: 180, color: color(2) },
    { name: 'Снятие', price: 5, duration: 30, color: color(3) },
    { name: 'Коррекция', price: 20, duration: 90, color: color(4) },
  ],
  brows: [
    { name: 'Коррекция бровей', price: 10, duration: 30, color: color(0) },
    { name: 'Окрашивание бровей', price: 15, duration: 45, color: color(1) },
    { name: 'Ламинирование бровей', price: 25, duration: 60, color: color(2) },
  ],
  cosmetology: [
    { name: 'Чистка лица', price: 40, duration: 90, color: color(0) },
    { name: 'Пилинг', price: 30, duration: 60, color: color(1) },
    { name: 'Массаж лица', price: 25, duration: 45, color: color(2) },
    { name: 'Уходовая процедура', price: 50, duration: 90, color: color(3) },
  ],

  // Repair
  electrician: [
    { name: 'Диагностика', price: 15, duration: 60, color: color(0) },
    { name: 'Замена розетки', price: 10, duration: 30, color: color(1) },
    { name: 'Замена проводки', price: 50, duration: 240, color: color(2) },
    { name: 'Установка светильника', price: 20, duration: 60, color: color(3) },
  ],
  plumber: [
    { name: 'Диагностика', price: 15, duration: 60, color: color(0) },
    { name: 'Замена крана', price: 20, duration: 60, color: color(1) },
    { name: 'Прочистка трубы', price: 30, duration: 90, color: color(2) },
    { name: 'Установка смесителя', price: 25, duration: 60, color: color(3) },
  ],
  handyman: [
    { name: 'Мелкий ремонт', price: 20, duration: 60, color: color(0) },
    { name: 'Навес полки', price: 15, duration: 30, color: color(1) },
    { name: 'Ремонт двери', price: 30, duration: 90, color: color(2) },
  ],
  furniture: [
    { name: 'Сборка шкафа', price: 50, duration: 180, color: color(0) },
    { name: 'Сборка кухни', price: 100, duration: 480, color: color(1) },
    { name: 'Сборка кровати', price: 30, duration: 120, color: color(2) },
  ],

  // Education
  tutor: [
    { name: 'Занятие 45 мин', price: 15, duration: 45, color: color(0) },
    { name: 'Занятие 60 мин', price: 20, duration: 60, color: color(1) },
    { name: 'Занятие 90 мин', price: 25, duration: 90, color: color(2) },
  ],
  trainer: [
    { name: 'Персональная тренировка', price: 30, duration: 60, color: color(0) },
    { name: 'Групповая тренировка', price: 15, duration: 60, color: color(1) },
    { name: 'Программа питания', price: 50, duration: 90, color: color(2) },
  ],
  instructor: [
    { name: 'Занятие 60 мин', price: 25, duration: 60, color: color(0) },
    { name: 'Занятие 90 мин', price: 35, duration: 90, color: color(1) },
  ],

  // Photo
  photographer: [
    { name: 'Портретная съёмка', price: 50, duration: 120, color: color(0) },
    { name: 'Свадьба', price: 300, duration: 600, color: color(1) },
    { name: 'Предметная съёмка', price: 80, duration: 180, color: color(2) },
    { name: 'Love story', price: 100, duration: 180, color: color(3) },
  ],
  videographer: [
    { name: 'Съёмка ролика', price: 150, duration: 300, color: color(0) },
    { name: 'Свадьба', price: 400, duration: 600, color: color(1) },
    { name: 'Монтаж', price: 100, duration: 480, color: color(2) },
  ],
  designer: [
    { name: 'Логотип', price: 100, duration: 480, color: color(0) },
    { name: 'Баннер', price: 30, duration: 120, color: color(1) },
    { name: 'Визитка', price: 20, duration: 60, color: color(2) },
  ],

  // Auto
  mechanic: [
    { name: 'Диагностика', price: 20, duration: 60, color: color(0) },
    { name: 'Замена масла', price: 30, duration: 60, color: color(1) },
    { name: 'Замена колодок', price: 40, duration: 90, color: color(2) },
  ],
  detailing: [
    { name: 'Полировка кузова', price: 100, duration: 360, color: color(0) },
    { name: 'Керамика', price: 250, duration: 480, color: color(1) },
    { name: 'Химчистка салона', price: 80, duration: 300, color: color(2) },
  ],
  carwash: [
    { name: 'Мойка кузова', price: 5, duration: 30, color: color(0) },
    { name: 'Комплекс', price: 10, duration: 60, color: color(1) },
    { name: 'Мойка двигателя', price: 15, duration: 45, color: color(2) },
  ],

  // Auto (new)
  tinting: [
    { name: 'Тонировка боковых', price: 50, duration: 120, color: color(0) },
    { name: 'Тонировка полная', price: 100, duration: 240, color: color(1) },
  ],
  tire: [
    { name: 'Перебортовка 4 колеса', price: 20, duration: 60, color: color(0) },
    { name: 'Балансировка', price: 8, duration: 30, color: color(1) },
  ],

  // Beauty (new)
  makeup: [
    { name: 'Дневной макияж', price: 30, duration: 60, color: color(0) },
    { name: 'Вечерний макияж', price: 50, duration: 90, color: color(1) },
    { name: 'Свадебный макияж', price: 80, duration: 120, color: color(2) },
  ],
  depilation: [
    { name: 'Шугаринг ноги', price: 25, duration: 60, color: color(0) },
    { name: 'Шугаринг бикини', price: 20, duration: 45, color: color(1) },
    { name: 'Шугаринг подмышки', price: 8, duration: 20, color: color(2) },
  ],
  tattoo: [
    { name: 'Мини тату', price: 50, duration: 60, color: color(0) },
    { name: 'Средняя работа', price: 150, duration: 180, color: color(1) },
    { name: 'Крупная работа', price: 300, duration: 360, color: color(2) },
    { name: 'Консультация', price: 10, duration: 30, color: color(3) },
  ],
  stylist: [
    { name: 'Подбор образа', price: 100, duration: 120, color: color(0) },
    { name: 'Разбор гардероба', price: 80, duration: 180, color: color(1) },
    { name: 'Шопинг-сопровождение', price: 150, duration: 240, color: color(2) },
  ],

  // Health
  massage: [
    { name: 'Массаж спины', price: 25, duration: 45, color: color(0) },
    { name: 'Общий массаж', price: 40, duration: 60, color: color(1) },
    { name: 'Антицеллюлитный', price: 35, duration: 60, color: color(2) },
    { name: 'Массаж лица и шеи', price: 20, duration: 30, color: color(3) },
  ],
  psychologist: [
    { name: 'Консультация 50 мин', price: 40, duration: 50, color: color(0) },
    { name: 'Консультация 90 мин', price: 60, duration: 90, color: color(1) },
    { name: 'Семейная терапия', price: 70, duration: 90, color: color(2) },
  ],
  osteopath: [
    { name: 'Первичный приём', price: 50, duration: 60, color: color(0) },
    { name: 'Повторный приём', price: 40, duration: 45, color: color(1) },
  ],
  nutritionist: [
    { name: 'Консультация', price: 30, duration: 60, color: color(0) },
    { name: 'Программа питания', price: 80, duration: 90, color: color(1) },
  ],
  speech: [
    { name: 'Занятие 30 мин', price: 15, duration: 30, color: color(0) },
    { name: 'Занятие 45 мин', price: 20, duration: 45, color: color(1) },
    { name: 'Диагностика', price: 30, duration: 60, color: color(2) },
  ],

  // Education (new)
  coach: [
    { name: 'Коуч-сессия 60 мин', price: 50, duration: 60, color: color(0) },
    { name: 'Коуч-сессия 90 мин', price: 70, duration: 90, color: color(1) },
  ],
  music_teacher: [
    { name: 'Урок 45 мин', price: 20, duration: 45, color: color(0) },
    { name: 'Урок 60 мин', price: 25, duration: 60, color: color(1) },
  ],
  dance: [
    { name: 'Индивидуальный урок', price: 30, duration: 60, color: color(0) },
    { name: 'Групповое занятие', price: 10, duration: 60, color: color(1) },
  ],

  // Photo (new)
  smm: [
    { name: 'Ведение 1 месяц', price: 300, duration: 480, color: color(0) },
    { name: 'Контент-план', price: 50, duration: 120, color: color(1) },
    { name: 'Reels (1 ролик)', price: 30, duration: 120, color: color(2) },
  ],
  target: [
    { name: 'Настройка рекламы', price: 100, duration: 180, color: color(0) },
    { name: 'Аудит рекламы', price: 50, duration: 90, color: color(1) },
    { name: 'Ведение 1 месяц', price: 250, duration: 480, color: color(2) },
  ],

  // Home
  cleaning: [
    { name: 'Уборка квартиры', price: 30, duration: 180, color: color(0) },
    { name: 'Генеральная уборка', price: 60, duration: 360, color: color(1) },
    { name: 'Уборка после ремонта', price: 80, duration: 480, color: color(2) },
    { name: 'Мытьё окон', price: 20, duration: 120, color: color(3) },
  ],
  nanny: [
    { name: '1 час', price: 5, duration: 60, color: color(0) },
    { name: 'Полдня (4 часа)', price: 18, duration: 240, color: color(1) },
    { name: 'Полный день (8 часов)', price: 35, duration: 480, color: color(2) },
  ],
  gardener: [
    { name: 'Стрижка газона', price: 20, duration: 120, color: color(0) },
    { name: 'Обрезка деревьев', price: 30, duration: 180, color: color(1) },
    { name: 'Посадка растений', price: 25, duration: 120, color: color(2) },
  ],
  cook: [
    { name: 'Ужин на 2', price: 50, duration: 180, color: color(0) },
    { name: 'Банкет (10 персон)', price: 200, duration: 480, color: color(1) },
  ],
  moving: [
    { name: 'Переезд 1-комн.', price: 50, duration: 240, color: color(0) },
    { name: 'Переезд 2-комн.', price: 80, duration: 360, color: color(1) },
    { name: 'Перевозка мебели', price: 30, duration: 120, color: color(2) },
  ],

  // Pets
  groomer: [
    { name: 'Стрижка собаки', price: 30, duration: 120, color: color(0) },
    { name: 'Стрижка кошки', price: 25, duration: 90, color: color(1) },
    { name: 'Мытьё + сушка', price: 15, duration: 60, color: color(2) },
    { name: 'Когти + уши', price: 5, duration: 20, color: color(3) },
  ],
  dog_trainer: [
    { name: 'Занятие 60 мин', price: 30, duration: 60, color: color(0) },
    { name: 'Курс (10 занятий)', price: 250, duration: 60, color: color(1) },
  ],
  pet_sitter: [
    { name: 'Передержка (сутки)', price: 15, duration: 1440, color: color(0) },
    { name: 'Выгул собаки', price: 5, duration: 60, color: color(1) },
  ],
  vet: [
    { name: 'Осмотр', price: 20, duration: 30, color: color(0) },
    { name: 'Вакцинация', price: 30, duration: 30, color: color(1) },
    { name: 'Чипирование', price: 25, duration: 15, color: color(2) },
  ],

  // Events
  host: [
    { name: 'Свадьба', price: 500, duration: 480, color: color(0) },
    { name: 'День рождения', price: 200, duration: 240, color: color(1) },
    { name: 'Корпоратив', price: 400, duration: 360, color: color(2) },
  ],
  animator: [
    { name: 'Детский праздник (2 ч)', price: 80, duration: 120, color: color(0) },
    { name: 'Аквагрим', price: 30, duration: 60, color: color(1) },
  ],
  dj: [
    { name: 'Свадьба', price: 300, duration: 480, color: color(0) },
    { name: 'Корпоратив', price: 250, duration: 360, color: color(1) },
    { name: 'Частная вечеринка', price: 150, duration: 240, color: color(2) },
  ],
  decorator: [
    { name: 'Оформление зала', price: 200, duration: 360, color: color(0) },
    { name: 'Фотозона', price: 100, duration: 180, color: color(1) },
    { name: 'Шары и декор', price: 50, duration: 120, color: color(2) },
  ],
  baker: [
    { name: 'Торт (1 кг)', price: 30, duration: 480, color: color(0) },
    { name: 'Капкейки (12 шт)', price: 25, duration: 240, color: color(1) },
    { name: 'Кейк-попсы (20 шт)', price: 20, duration: 180, color: color(2) },
  ],

  // Handmade & Food
  cakes: [
    { name: 'Торт 1 кг', price: 30, duration: 480, color: color(0) },
    { name: 'Торт 2 кг', price: 55, duration: 480, color: color(1) },
    { name: 'Торт 3 кг', price: 80, duration: 600, color: color(2) },
    { name: 'Капкейки (12 шт)', price: 25, duration: 240, color: color(3) },
    { name: 'Кейк-попсы (20 шт)', price: 20, duration: 180, color: color(4) },
    { name: 'Бенто-торт', price: 18, duration: 180, color: color(5) },
  ],
  baking: [
    { name: 'Печенье (набор)', price: 15, duration: 180, color: color(0) },
    { name: 'Макарон (12 шт)', price: 20, duration: 240, color: color(1) },
    { name: 'Пирог', price: 12, duration: 120, color: color(2) },
    { name: 'Конфеты ручной работы', price: 25, duration: 240, color: color(3) },
  ],
  candles: [
    { name: 'Свеча соевая', price: 8, duration: 120, color: color(0) },
    { name: 'Набор свечей (3 шт)', price: 20, duration: 240, color: color(1) },
    { name: 'Мыло ручной работы', price: 5, duration: 60, color: color(2) },
    { name: 'Подарочный набор', price: 30, duration: 180, color: color(3) },
  ],
  florist: [
    { name: 'Букет стандарт', price: 30, duration: 60, color: color(0) },
    { name: 'Букет премиум', price: 60, duration: 90, color: color(1) },
    { name: 'Композиция в коробке', price: 40, duration: 60, color: color(2) },
    { name: 'Оформление свадьбы', price: 300, duration: 480, color: color(3) },
  ],
  knitting: [
    { name: 'Шапка', price: 20, duration: 480, color: color(0) },
    { name: 'Шарф', price: 25, duration: 600, color: color(1) },
    { name: 'Свитер', price: 80, duration: 2400, color: color(2) },
    { name: 'Игрушка амигуруми', price: 30, duration: 480, color: color(3) },
  ],
  jewelry: [
    { name: 'Серьги', price: 15, duration: 120, color: color(0) },
    { name: 'Браслет', price: 12, duration: 90, color: color(1) },
    { name: 'Колье', price: 30, duration: 180, color: color(2) },
    { name: 'Набор (серьги + кольцо)', price: 35, duration: 240, color: color(3) },
  ],
  pottery: [
    { name: 'Кружка', price: 15, duration: 180, color: color(0) },
    { name: 'Тарелка', price: 20, duration: 240, color: color(1) },
    { name: 'Ваза', price: 30, duration: 360, color: color(2) },
  ],
  resin: [
    { name: 'Подставка', price: 15, duration: 240, color: color(0) },
    { name: 'Украшение', price: 20, duration: 180, color: color(1) },
    { name: 'Столешница', price: 150, duration: 1440, color: color(2) },
  ],

  // Other
  custom: [],
};
