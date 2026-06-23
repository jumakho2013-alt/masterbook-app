import type { ProfessionPack } from '@/src/types/professionPack';

/**
 * Pack: фотограф. Третий пример чтобы покрыть creative-вертикаль.
 *
 * Различия:
 *   • client → остаётся «клиент», но appointment → «съёмка»
 *   • per-project pricing вместо per-hour
 *   • custom field: дедлайн выдачи материалов, depositPaid
 *   • sleeping client message — иной тон (фотограф редко работает с
 *     постоянными клиентами, поэтому sleeping = тёплый «вспомни обо мне»)
 */
export const photographerPack: ProfessionPack = {
  slug: 'photographer',
  version: '1.0.0',
  name: { ru: 'Фотограф', en: 'Photographer' },
  category: 'creative',

  vocabulary: {
    'client.singular': 'клиент',
    'client.plural': 'клиенты',
    'client.empty.title': 'Нет клиентов',
    'client.empty.cta': 'Добавить первого клиента',
    'client.new.title': 'Новый клиент',
    'appointment.singular': 'съёмка',
    'appointment.plural': 'съёмки',
    'appointment.new': 'Новая съёмка',
    'service.singular': 'тип съёмки',
    'service.plural': 'типы съёмок',
    'master.role': 'фотограф',
  },

  defaultServices: [
    { name: 'Семейная фотосессия', price: 15000, duration: 120, color: '#F59E0B' },
    { name: 'Love story', price: 18000, duration: 180, color: '#FF6B9D' },
    { name: 'Свадебная — полный день', price: 60000, duration: 480, color: '#A78BFA' },
    { name: 'Контент для соцсетей', price: 8000, duration: 90, color: '#10B981' },
    { name: 'Портфолио', price: 12000, duration: 120, color: '#3B82F6' },
  ],

  customFields: {
    client: [
      {
        key: 'instagram',
        label: 'Instagram',
        type: 'text',
      },
      {
        key: 'depositPaid',
        label: 'Внесён задаток',
        type: 'boolean',
      },
    ],
    appointment: [
      {
        key: 'location',
        label: 'Локация',
        type: 'text',
      },
      {
        key: 'deliveryDeadline',
        label: 'Срок выдачи',
        type: 'date',
      },
    ],
  },

  pinnedFilters: ['depositPaid'],

  emptyStates: {
    today: {
      title: 'Здесь будет твой день',
      subtitle: 'Добавь первую съёмку — или попробуй на примере.',
    },
    clients: { title: 'Нет клиентов', subtitle: 'Добавь первого клиента' },
    services: { title: 'Нет типов съёмок', subtitle: 'Опиши свои пакеты' },
    money: { title: 'Нет операций', subtitle: 'Доходы и задатки появятся здесь' },
  },

  reminderTemplate: {
    beforeAppointment: '{client}, привет! Напоминаю — съёмка {day} в {time} 📸 Локация прежняя? Если что-то меняется, дайте знать.',
    sleeping: '{client}, привет! Если задумываетесь о новой съёмке — в этом месяце есть свободные даты. Напишите, обсудим ✨',
  },

  firstWeekChecklist: [
    { id: 'add-client', label: 'Добавь первого клиента', href: '/client/new' },
    { id: 'add-service', label: 'Опиши пакеты съёмок', href: '/services/manage' },
    { id: 'create-appointment', label: 'Запланируй первую съёмку', href: '/appointment/new' },
  ],
};
