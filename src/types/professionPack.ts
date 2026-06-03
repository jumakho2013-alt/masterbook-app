/**
 * ProfessionPack — конфигурация под конкретную профессию (маникюр, репетитор,
 * фотограф …). Pack — это ЧИСТЫЕ ДАННЫЕ (JSON-like), без выполнения кода.
 * Архитектурный принцип из PLAN-V2.md §2:
 *
 *   • Навигация (Today/Clients/Money/Services/Settings) — одна для всех.
 *   • Различия выражаются через:
 *       - vocabulary  — словарь («клиент» → «ученик» / «съёмка»)
 *       - seed data   — стартовые услуги при онбординге
 *       - empty states — что показывать когда нет данных
 *       - first-week checklist — 5 шагов для активации
 *       - reminder template — шаблон сообщения клиенту
 *       - sample data — пример клиентов/записей для «попробовать»
 *
 * Расширения (v2): customFields, pinnedFilters. Сейчас заложены как поля
 * пака, но UI к ним ещё не подключён — это foundation для будущей работы.
 */

/** Ключи словаря — ровно те понятия что меняются между профессиями. */
export type VocabularyKey =
  // Сущности
  | 'client.singular'        // «клиент» / «ученик» / «съёмка»
  | 'client.plural'          // «клиенты» / «ученики» / «съёмки»
  | 'client.genitive'        // «нет клиентов» / «нет учеников»
  | 'client.empty.title'     // «Нет клиентов»
  | 'client.empty.cta'       // «Добавить первого клиента»
  | 'client.new.title'       // «Новый клиент»
  | 'appointment.singular'   // «запись» / «занятие» / «съёмка»
  | 'appointment.plural'     // «записи» / «занятия» / «съёмки»
  | 'appointment.new'        // «Новая запись» / «Новое занятие»
  | 'service.singular'       // «услуга» / «предмет» / «тип съёмки»
  | 'service.plural'         // «услуги» / «предметы» / «типы съёмок»
  | 'master.role';           // «мастер» / «преподаватель» / «фотограф»

/** Простая шаблонная подстановка через {placeholder}. */
export type VocabularyMap = Partial<Record<VocabularyKey, string>>;

export interface PackServiceTemplate {
  name: string;
  /** Цена в дефолтной валюте мастера (число без локализации). */
  price: number;
  /** Длительность в минутах. */
  duration: number;
  /** Hex color для chip / event-block. */
  color: string;
}

export interface PackEmptyStates {
  today?: { title: string; subtitle: string };
  clients?: { title: string; subtitle: string };
  services?: { title: string; subtitle: string };
  money?: { title: string; subtitle: string };
}

export interface PackChecklistItem {
  id: string;
  label: string;
  /** route (expo-router path) куда вести на тап. Опционально. */
  href?: string;
}

/**
 * Шаблон сообщения для напоминания клиенту/ученику. Поддерживает плейсхолдеры:
 *   {client}  — имя
 *   {day}     — день (например «завтра», «в среду»)
 *   {time}    — время («14:30»)
 *   {service} — название услуги
 */
export interface PackReminderTemplate {
  /** Для appointment reminder (за час / за день) */
  beforeAppointment: string;
  /** Для idle/sleeping client outreach */
  sleeping: string;
}

export interface CustomFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'phone' | 'url' | 'boolean';
  /** Для type='select' */
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Показывать ли в листе клиентов под именем. */
  showInList?: boolean;
}

export interface ProfessionPack {
  /** Уникальный slug (= filename без расширения). */
  slug: string;
  /** Semver для возможной миграции в будущем. */
  version: string;
  /** Имя пака (тоже подлежит локализации потом). */
  name: { ru: string; en?: string };
  /** Категория для группировки в picker (beauty/health/edu/repair/creative). */
  category: 'beauty' | 'health' | 'education' | 'repair' | 'creative' | 'pets' | 'other';
  vocabulary: VocabularyMap;
  defaultServices: PackServiceTemplate[];
  customFields: {
    client?: CustomFieldDef[];
    appointment?: CustomFieldDef[];
  };
  pinnedFilters?: string[];
  emptyStates: PackEmptyStates;
  firstWeekChecklist?: PackChecklistItem[];
  reminderTemplate: PackReminderTemplate;
}
