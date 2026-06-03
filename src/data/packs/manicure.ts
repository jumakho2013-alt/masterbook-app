import type { ProfessionPack } from '@/src/types/professionPack';

/** Pack: маникюр. Default-вертикаль для бьюти-мастеров СНГ. */
export const manicurePack: ProfessionPack = {
  slug: 'manicure',
  version: '1.0.0',
  name: { ru: 'Маникюр', en: 'Nail tech' },
  category: 'beauty',

  vocabulary: {
    // Используем дефолтные термины — клиент/запись/услуга — это «канон»
    // против которого определяются остальные паки.
    'client.singular': 'клиент',
    'client.plural': 'клиенты',
    'client.empty.title': 'Нет клиентов',
    'client.empty.cta': 'Добавить первого клиента',
    'client.new.title': 'Новый клиент',
    'appointment.singular': 'запись',
    'appointment.plural': 'записи',
    'appointment.new': 'Новая запись',
    'service.singular': 'услуга',
    'service.plural': 'услуги',
    'master.role': 'мастер',
  },

  defaultServices: [
    { name: 'Маникюр классический', price: 2500, duration: 60, color: '#FF6B9D' },
    { name: 'Маникюр + гель-лак', price: 3500, duration: 90, color: '#A78BFA' },
    { name: 'Педикюр', price: 3000, duration: 75, color: '#10B981' },
    { name: 'Дизайн ногтей', price: 1500, duration: 45, color: '#F59E0B' },
    { name: 'Снятие покрытия', price: 800, duration: 20, color: '#4ECDC4' },
  ],

  customFields: {
    client: [
      {
        key: 'preferredShape',
        label: 'Форма ногтей',
        type: 'select',
        options: [
          { value: 'square', label: 'Квадрат' },
          { value: 'almond', label: 'Миндаль' },
          { value: 'oval', label: 'Овал' },
          { value: 'coffin', label: 'Балерина' },
        ],
        showInList: false,
      },
      {
        key: 'allergies',
        label: 'Аллергии',
        type: 'text',
        showInList: true,
      },
    ],
  },

  pinnedFilters: ['preferredShape'],

  emptyStates: {
    today: {
      title: 'Здесь будет твой день',
      subtitle: 'Добавь первого клиента и запись — или попробуй на примере.',
    },
    clients: { title: 'Нет клиентов', subtitle: 'Добавь первого клиента' },
    services: { title: 'Нет услуг', subtitle: 'Создай свой прайс-лист' },
    money: { title: 'Нет операций', subtitle: 'Доходы и расходы появятся здесь' },
  },

  reminderTemplate: {
    beforeAppointment: '{client}, жду тебя {day} в {time} 💅',
    sleeping: '{client}, привет! Прошло уже {days} дн. с последнего визита — может, пора обновить?',
  },

  firstWeekChecklist: [
    { id: 'add-client', label: 'Добавь первого клиента', href: '/client/new' },
    { id: 'add-service', label: 'Проверь прайс-лист', href: '/services/manage' },
    { id: 'create-appointment', label: 'Создай первую запись', href: '/appointment/new' },
    { id: 'work-hours', label: 'Настрой рабочее время', href: '/settings/work-hours' },
    { id: 'enable-biometric', label: 'Включи Face ID', href: '/settings/account' },
  ],
};
