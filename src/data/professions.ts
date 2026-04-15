import type { ProfessionCategoryInfo, FieldConfig } from '@/src/types';

const defaultFieldConfig: FieldConfig = {
  clientAddress: false,
  beforeAfterPhotos: false,
  materials: false,
  extraDescription: { enabled: false, label: '' },
  timeStep: 60,
  durationRange: { min: 30, max: 480 },
};

export const professionCategories: ProfessionCategoryInfo[] = [
  {
    id: 'beauty',
    name: 'Красота',
    icon: 'Sparkles',
    color: '#FF6B9D',
    specializations: [
      { id: 'nails', category: 'beauty', name: 'Маникюр', icon: 'Hand' },
      { id: 'hair', category: 'beauty', name: 'Парикмахер', icon: 'Scissors' },
      { id: 'lashes', category: 'beauty', name: 'Ресницы', icon: 'Eye' },
      { id: 'brows', category: 'beauty', name: 'Брови', icon: 'Pen' },
      { id: 'cosmetology', category: 'beauty', name: 'Косметолог', icon: 'Droplets' },
      { id: 'makeup', category: 'beauty', name: 'Визажист', icon: 'Palette' },
      { id: 'depilation', category: 'beauty', name: 'Депиляция / Шугаринг', icon: 'Leaf' },
      { id: 'tattoo', category: 'beauty', name: 'Тату-мастер', icon: 'PenTool' },
      { id: 'stylist', category: 'beauty', name: 'Стилист', icon: 'Shirt' },
    ],
    defaultFieldConfig: {
      clientAddress: false,
      beforeAfterPhotos: true,
      materials: true,
      extraDescription: { enabled: false, label: '' },
      timeStep: 30,
      durationRange: { min: 30, max: 180 },
    },
  },
  {
    id: 'health',
    name: 'Здоровье',
    icon: 'Heart',
    color: '#F472B6',
    specializations: [
      { id: 'massage', category: 'health', name: 'Массажист', icon: 'HeartHandshake' },
      { id: 'psychologist', category: 'health', name: 'Психолог', icon: 'Brain' },
      { id: 'osteopath', category: 'health', name: 'Остеопат', icon: 'Activity' },
      { id: 'nutritionist', category: 'health', name: 'Нутрициолог', icon: 'Apple' },
      { id: 'speech', category: 'health', name: 'Логопед', icon: 'MessageCircle' },
    ],
    defaultFieldConfig: {
      clientAddress: false,
      beforeAfterPhotos: false,
      materials: false,
      extraDescription: { enabled: true, label: 'Жалоба / запрос' },
      timeStep: 60,
      durationRange: { min: 30, max: 120 },
    },
  },
  {
    id: 'repair',
    name: 'Ремонт и сервис',
    icon: 'Wrench',
    color: '#4ECDC4',
    specializations: [
      { id: 'electrician', category: 'repair', name: 'Электрик', icon: 'Zap' },
      { id: 'plumber', category: 'repair', name: 'Сантехник', icon: 'Droplet' },
      { id: 'handyman', category: 'repair', name: 'Мастер по ремонту', icon: 'Hammer' },
      { id: 'furniture', category: 'repair', name: 'Сборка мебели', icon: 'Armchair' },
      { id: 'ac_repair', category: 'repair', name: 'Кондиционеры', icon: 'Wind' },
      { id: 'locksmith', category: 'repair', name: 'Замки и двери', icon: 'Lock' },
      { id: 'painter', category: 'repair', name: 'Маляр', icon: 'Paintbrush' },
      { id: 'tiler', category: 'repair', name: 'Плиточник', icon: 'Grid3x3' },
    ],
    defaultFieldConfig: {
      clientAddress: true,
      beforeAfterPhotos: false,
      materials: true,
      extraDescription: { enabled: true, label: 'Что сломалось' },
      timeStep: 60,
      durationRange: { min: 60, max: 480 },
    },
  },
  {
    id: 'education',
    name: 'Образование',
    icon: 'GraduationCap',
    color: '#A78BFA',
    specializations: [
      { id: 'tutor', category: 'education', name: 'Репетитор', icon: 'BookOpen' },
      { id: 'trainer', category: 'education', name: 'Тренер', icon: 'Dumbbell' },
      { id: 'instructor', category: 'education', name: 'Инструктор', icon: 'UserCheck' },
      { id: 'coach', category: 'education', name: 'Коуч', icon: 'Target' },
      { id: 'music_teacher', category: 'education', name: 'Учитель музыки', icon: 'Music' },
      { id: 'dance', category: 'education', name: 'Танцы', icon: 'Footprints' },
    ],
    defaultFieldConfig: {
      clientAddress: false,
      beforeAfterPhotos: false,
      materials: false,
      extraDescription: { enabled: true, label: 'Предмет / класс' },
      timeStep: 60,
      durationRange: { min: 45, max: 120 },
    },
  },
  {
    id: 'photo',
    name: 'Фото и креатив',
    icon: 'Camera',
    color: '#F59E0B',
    specializations: [
      { id: 'photographer', category: 'photo', name: 'Фотограф', icon: 'Camera' },
      { id: 'videographer', category: 'photo', name: 'Видеограф', icon: 'Video' },
      { id: 'designer', category: 'photo', name: 'Дизайнер', icon: 'Palette' },
      { id: 'smm', category: 'photo', name: 'SMM-специалист', icon: 'Share2' },
      { id: 'target', category: 'photo', name: 'Таргетолог', icon: 'Target' },
    ],
    defaultFieldConfig: {
      clientAddress: true,
      beforeAfterPhotos: true,
      materials: false,
      extraDescription: { enabled: true, label: 'Тип съёмки' },
      timeStep: 'fullday',
      durationRange: { min: 60, max: 720 },
    },
  },
  {
    id: 'auto',
    name: 'Авто',
    icon: 'Car',
    color: '#3B82F6',
    specializations: [
      { id: 'mechanic', category: 'auto', name: 'Автомастер', icon: 'Settings' },
      { id: 'detailing', category: 'auto', name: 'Детейлинг', icon: 'Sparkles' },
      { id: 'carwash', category: 'auto', name: 'Автомойка', icon: 'Droplets' },
      { id: 'tinting', category: 'auto', name: 'Тонировка', icon: 'Square' },
      { id: 'tire', category: 'auto', name: 'Шиномонтаж', icon: 'Circle' },
    ],
    defaultFieldConfig: {
      clientAddress: false,
      beforeAfterPhotos: true,
      materials: true,
      extraDescription: { enabled: true, label: 'Марка / модель' },
      timeStep: 60,
      durationRange: { min: 30, max: 480 },
    },
  },
  {
    id: 'home',
    name: 'Дом и быт',
    icon: 'Home',
    color: '#10B981',
    specializations: [
      { id: 'cleaning', category: 'home', name: 'Клининг', icon: 'Sparkles' },
      { id: 'nanny', category: 'home', name: 'Няня', icon: 'Baby' },
      { id: 'gardener', category: 'home', name: 'Садовник', icon: 'Flower2' },
      { id: 'cook', category: 'home', name: 'Повар на дом', icon: 'ChefHat' },
      { id: 'moving', category: 'home', name: 'Грузоперевозки', icon: 'Truck' },
    ],
    defaultFieldConfig: {
      clientAddress: true,
      beforeAfterPhotos: false,
      materials: true,
      extraDescription: { enabled: true, label: 'Описание' },
      timeStep: 60,
      durationRange: { min: 60, max: 480 },
    },
  },
  {
    id: 'pets',
    name: 'Питомцы',
    icon: 'PawPrint',
    color: '#FB923C',
    specializations: [
      { id: 'groomer', category: 'pets', name: 'Грумер', icon: 'Scissors' },
      { id: 'dog_trainer', category: 'pets', name: 'Кинолог', icon: 'Dog' },
      { id: 'pet_sitter', category: 'pets', name: 'Передержка', icon: 'Home' },
      { id: 'vet', category: 'pets', name: 'Ветеринар', icon: 'Stethoscope' },
    ],
    defaultFieldConfig: {
      clientAddress: true,
      beforeAfterPhotos: true,
      materials: true,
      extraDescription: { enabled: true, label: 'Питомец / порода' },
      timeStep: 60,
      durationRange: { min: 30, max: 180 },
    },
  },
  {
    id: 'events',
    name: 'Праздники',
    icon: 'PartyPopper',
    color: '#EC4899',
    specializations: [
      { id: 'host', category: 'events', name: 'Ведущий', icon: 'Mic' },
      { id: 'animator', category: 'events', name: 'Аниматор', icon: 'Smile' },
      { id: 'dj', category: 'events', name: 'DJ', icon: 'Music' },
      { id: 'decorator', category: 'events', name: 'Декоратор', icon: 'Flower2' },
      { id: 'baker', category: 'events', name: 'Торты на заказ', icon: 'Cake' },
    ],
    defaultFieldConfig: {
      clientAddress: true,
      beforeAfterPhotos: true,
      materials: true,
      extraDescription: { enabled: true, label: 'Тип мероприятия' },
      timeStep: 'fullday',
      durationRange: { min: 120, max: 720 },
    },
  },
  {
    id: 'handmade',
    name: 'Хендмейд и еда',
    icon: 'Gift',
    color: '#F97316',
    specializations: [
      { id: 'cakes', category: 'handmade', name: 'Торты на заказ', icon: 'Cake' },
      { id: 'baking', category: 'handmade', name: 'Домашняя выпечка', icon: 'Cookie' },
      { id: 'candles', category: 'handmade', name: 'Свечи / мыло', icon: 'Flame' },
      { id: 'florist', category: 'handmade', name: 'Флорист / букеты', icon: 'Flower2' },
      { id: 'knitting', category: 'handmade', name: 'Вязание / шитьё', icon: 'Scissors' },
      { id: 'jewelry', category: 'handmade', name: 'Украшения', icon: 'Gem' },
      { id: 'pottery', category: 'handmade', name: 'Керамика', icon: 'Coffee' },
      { id: 'resin', category: 'handmade', name: 'Эпоксидная смола', icon: 'Droplets' },
    ],
    defaultFieldConfig: {
      clientAddress: true,
      beforeAfterPhotos: true,
      materials: true,
      extraDescription: { enabled: true, label: 'Описание заказа' },
      timeStep: 'fullday',
      durationRange: { min: 60, max: 1440 },
    },
  },
  {
    id: 'other',
    name: 'Другое',
    icon: 'LayoutGrid',
    color: '#8E8E93',
    specializations: [
      { id: 'custom', category: 'other', name: 'Свободная настройка', icon: 'Settings' },
    ],
    defaultFieldConfig,
  },
];

export function getCategory(id: string) {
  return professionCategories.find((c) => c.id === id);
}

export function getSpecialization(id: string) {
  for (const cat of professionCategories) {
    const spec = cat.specializations.find((s) => s.id === id);
    if (spec) return spec;
  }
  return undefined;
}

export function getDefaultFieldConfig(categoryId: string): FieldConfig {
  return getCategory(categoryId)?.defaultFieldConfig ?? defaultFieldConfig;
}
