import type { ProfessionPack } from '@/src/types/professionPack';

/**
 * Pack: репетитор. Главная задача — продемонстрировать что архитектура
 * паков работает: vocabulary swap делает интерфейс «родным» для другой
 * профессии без переписывания компонентов.
 *
 * Различия с manicure:
 *   • client → «ученик», «ученики»
 *   • appointment → «занятие», «занятия»
 *   • service → «предмет»
 *   • master → «преподаватель»
 *   • default-услуги: математика / английский / физика
 *   • custom-fields: класс школы, родитель, домашнее задание
 *   • sleeping-message звучит мягче (родители платят, не оттолкнуть)
 */
export const tutorPack: ProfessionPack = {
  slug: 'tutor',
  version: '1.0.0',
  name: { ru: 'Репетитор', en: 'Tutor' },
  category: 'education',

  vocabulary: {
    'client.singular': 'ученик',
    'client.plural': 'ученики',
    'client.empty.title': 'Нет учеников',
    'client.empty.cta': 'Добавить первого ученика',
    'client.new.title': 'Новый ученик',
    'appointment.singular': 'занятие',
    'appointment.plural': 'занятия',
    'appointment.new': 'Новое занятие',
    'service.singular': 'предмет',
    'service.plural': 'предметы',
    'master.role': 'преподаватель',
  },

  defaultServices: [
    { name: 'Математика — 60 мин', price: 1500, duration: 60, color: '#3B82F6' },
    { name: 'Математика — 90 мин', price: 2200, duration: 90, color: '#3B82F6' },
    { name: 'Английский — 60 мин', price: 1800, duration: 60, color: '#F59E0B' },
    { name: 'Физика — 90 мин', price: 2500, duration: 90, color: '#A78BFA' },
    { name: 'ОГЭ интенсив', price: 3500, duration: 120, color: '#FF6B9D' },
  ],

  customFields: {
    client: [
      {
        key: 'grade',
        label: 'Класс',
        type: 'select',
        options: [
          ...Array.from({ length: 11 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} класс` })),
          { value: 'student', label: 'Студент' },
          { value: 'adult', label: 'Взрослый' },
        ],
        showInList: true,
      },
      {
        key: 'parentPhone',
        label: 'Телефон родителя',
        type: 'phone',
      },
      {
        key: 'homework',
        label: 'Домашнее задание',
        type: 'text',
      },
    ],
  },

  pinnedFilters: ['grade'],

  emptyStates: {
    today: {
      title: 'Здесь будет твой день',
      subtitle: 'Добавь первого ученика и занятие — или попробуй на примере.',
    },
    clients: { title: 'Нет учеников', subtitle: 'Добавь первого ученика' },
    services: { title: 'Нет предметов', subtitle: 'Создай список предметов' },
    money: { title: 'Нет операций', subtitle: 'Доходы и расходы появятся здесь' },
  },

  reminderTemplate: {
    beforeAppointment: '{client}, напоминаю — {day} в {time} наше занятие 📚',
    sleeping: '{client}, привет! Давно не занимались — расписание обновлено, есть свободные слоты.',
  },

  firstWeekChecklist: [
    { id: 'add-client', label: 'Добавь первого ученика', href: '/client/new' },
    { id: 'add-service', label: 'Опиши свои предметы', href: '/services/manage' },
    { id: 'create-appointment', label: 'Создай первое занятие', href: '/appointment/new' },
    { id: 'work-hours', label: 'Настрой расписание', href: '/settings/work-hours' },
  ],
};
