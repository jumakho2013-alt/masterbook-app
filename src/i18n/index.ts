/**
 * i18n core — i18n-js + expo-localization.
 *
 * Архитектура:
 *   - locales/ru.json и locales/en.json содержат все строки UI
 *   - useT() hook возвращает t-function реактивную к смене language
 *   - Language stored в useSettingsStore.language ('ru' | 'en' | 'system')
 *   - При 'system' — берётся первый matched язык из getLocales() с fallback ru
 *
 * Migration plan:
 *   - Существующие hardcoded строки остаются работать
 *   - Новые компоненты используют useT()
 *   - Постепенно мигрируем экраны (отдельный спринт)
 */

import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { setDateLocale } from '@/src/utils/date';
import ruLocale from './locales/ru.json';
import enLocale from './locales/en.json';
// Per-namespace «extra» файлы — каждый экран-кластер в своём файле, чтобы
// миграцию можно вести параллельно без конфликтов в едином JSON.
// Каждый файл = { "<namespace>": { ... } }; мержим в корневой словарь.
import clientDetailRu from './locales/extra/clientDetail.ru.json';
import clientDetailEn from './locales/extra/clientDetail.en.json';
import apptRu from './locales/extra/appt.ru.json';
import apptEn from './locales/extra/appt.en.json';
import settingsRu from './locales/extra/settings.ru.json';
import settingsEn from './locales/extra/settings.en.json';
import miscRu from './locales/extra/misc.ru.json';
import miscEn from './locales/extra/misc.en.json';
import componentsRu from './locales/extra/components.ru.json';
import componentsEn from './locales/extra/components.en.json';

export type AppLanguage = 'system' | 'ru' | 'en';

const ru = Object.assign({}, ruLocale, clientDetailRu, apptRu, settingsRu, miscRu, componentsRu);
const en = Object.assign({}, enLocale, clientDetailEn, apptEn, settingsEn, miscEn, componentsEn);

const i18n = new I18n({ ru, en });
i18n.defaultLocale = 'ru';
i18n.enableFallback = true;

/** Резолвит финальный locale на основе настройки + system. */
export function resolveLocale(setting: AppLanguage): 'ru' | 'en' {
  if (setting === 'ru' || setting === 'en') return setting;
  // system: получаем первый supported из system locales.
  // getLocales() — нативный вызов expo-localization; в редких релизных
  // конфигурациях может бросить. Падать на старте из-за выбора языка нельзя —
  // при любой ошибке откатываемся на 'ru' (defaultLocale).
  try {
    const sys = getLocales();
    for (const l of sys) {
      const code = (l.languageCode ?? '').toLowerCase();
      if (code === 'ru' || code === 'en') return code as 'ru' | 'en';
    }
  } catch (err) {
    console.warn('[i18n] getLocales() failed, falling back to ru:', err);
  }
  return 'ru';
}

/** Применяет выбранный язык к i18n instance. Вызывается из useT и при
 *  смене настройки. Также синхронизирует локаль форматирования дат. */
export function applyLanguage(setting: AppLanguage) {
  const resolved = resolveLocale(setting);
  i18n.locale = resolved;
  setDateLocale(resolved);
}

/** Прямая t-функция (вне React-контекста — для notification сообщений и т.п.) */
export function t(key: string, options?: Record<string, string | number>): string {
  return i18n.t(key, options);
}

export { i18n };
