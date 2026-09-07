import { t } from '@/src/i18n';

/**
 * Текст напоминания клиенту мастер задаёт сам (фидбэк). Шаблон с плейсхолдерами,
 * один общий для всех клиентов. Поддерживаются RU и EN токены:
 *   {имя}/{name} · {время}/{time} · {услуга}/{service}
 * Ничего не отправляется автоматически — мастер жмёт «Напомнить», открывается
 * WhatsApp/SMS с уже подставленным текстом, отправляет он сам.
 */
export interface ReminderVars {
  name: string;
  time: string;
  service?: string;
}

/** Дефолтный шаблон (локализованный из i18n). */
export function defaultReminderTemplate(): string {
  return t('misc.reminderDefaultTemplate');
}

/** Подставить значения в шаблон. Пустой шаблон → дефолт. */
export function buildReminderMessage(template: string | null | undefined, vars: ReminderVars): string {
  const tpl = (template && template.trim()) || defaultReminderTemplate();
  const service = vars.service ?? '';
  return tpl
    .replace(/\{имя\}|\{name\}/gi, vars.name)
    .replace(/\{время\}|\{time\}/gi, vars.time)
    .replace(/\{услуга\}|\{service\}/gi, service)
    .trim();
}
