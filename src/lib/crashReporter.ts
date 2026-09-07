/**
 * Crash reporter — тонкая обёртка над Sentry.
 *
 * Включается только когда задан `EXPO_PUBLIC_SENTRY_DSN`. Без него модуль
 * Sentry даже не загружается (ленивый require), и все вызовы — no-op. Это
 * важно не только для тестов: без DSN незачем платить за загрузку нативного
 * модуля на старте.
 *
 * DSN задаётся через EAS Secrets, а не в репозитории:
 *   eas env:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://...@...ingest.sentry.io/..."
 *
 * ПРИВАТНОСТЬ. Мастер ведёт в приложении персональные данные СВОИХ клиентов —
 * имена, телефоны, заметки, суммы. Ничего из этого не должно попадать в Sentry
 * ни при каких обстоятельствах: это данные третьих лиц, на передачу которых
 * согласия никто не давал. Поэтому:
 *   • user — только opaque id, без email и телефона;
 *   • sendDefaultPii выключен;
 *   • beforeSend/beforeBreadcrumb вычищают всё, кроме белого списка полей;
 *   • в extra разрешены только скалярные значения, которые мы кладём сами.
 */

/** Уровень логирования сообщения. */
export type CrashReporterLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface CrashReporterContext {
  /** Тег категории ошибки, например 'cloud-sync-push'. */
  tag?: string;
  /** Дополнительные ключи. БЕЗ персональных данных — только техника. */
  extra?: Record<string, string | number | boolean>;
}

/** Минимальный кусок Sentry, которым мы пользуемся. Полный тип не тянем, чтобы
 *  файл не зависел от установленности пакета на этапе компиляции. */
interface SentryApi {
  init(options: Record<string, unknown>): void;
  captureException(e: unknown, hint?: Record<string, unknown>): void;
  captureMessage(m: string, level?: string): void;
  setUser(u: { id: string } | null): void;
}

let sentry: SentryApi | null = null;
let initialized = false;

/** `__DEV__` есть в React Native, но не в jest. Безопасное чтение. */
const isDev = (() => {
  try {
    return typeof __DEV__ !== 'undefined' && __DEV__ === true;
  } catch {
    return false;
  }
})();

/**
 * Поля события, которые разрешено отправлять. Всё остальное вырезается.
 * Белый список, а не чёрный: при добавлении нового поля в Sentry SDK оно по
 * умолчанию НЕ уедет, вместо того чтобы утечь до первого аудита.
 */
const РАЗРЕШЕННЫЕ_ПОЛЯ = new Set([
  'event_id', 'timestamp', 'platform', 'level', 'logger', 'environment',
  'release', 'dist', 'sdk', 'exception', 'tags', 'extra', 'contexts', 'user',
  'fingerprint', 'transaction', 'mechanism',
]);

/**
 * Вычистить из события всё, кроме белого списка. Sentry по умолчанию кладёт в
 * событие много контекста; оставляем только техническую часть.
 *
 * Экспортируется ради теста: ошибка здесь — это утечка персональных данных
 * КЛИЕНТОВ мастера в сторонний сервис, и заметить её по логам невозможно.
 */
export function очиститьСобытие(event: Record<string, unknown>): Record<string, unknown> {
  const чистое: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(event)) {
    if (РАЗРЕШЕННЫЕ_ПОЛЯ.has(k)) чистое[k] = v;
  }
  // user — только opaque id, никаких email/ip/имён.
  const u = чистое.user as { id?: string } | undefined;
  чистое.user = u?.id ? { id: u.id } : undefined;
  return чистое;
}

/** Безопасный init — можно звать многократно. */
export function initCrashReporter(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (isDev) console.log('[crashReporter] нет DSN — работаем вхолостую');
    return;
  }

  try {
    // Ленивый require: без DSN нативный модуль не грузится вовсе.
    sentry = require('@sentry/react-native') as SentryApi;
    sentry.init({
      dsn,
      environment: isDev ? 'development' : 'production',
      // Персональные данные третьих лиц (клиентов мастера) уехать не должны.
      sendDefaultPii: false,
      // Хлебные крошки — главный источник случайных утечек: в них попадают
      // тела HTTP-запросов и введённый текст. Отключаем целиком.
      maxBreadcrumbs: 0,
      enableAutoPerformanceTracing: false,
      tracesSampleRate: 0,
      beforeBreadcrumb: () => null,
      beforeSend: (event: Record<string, unknown>) => очиститьСобытие(event),
    });
  } catch (err) {
    // Падение инициализации телеметрии не должно ронять приложение.
    sentry = null;
    if (isDev) console.warn('[crashReporter] init не удался:', err);
  }
}

/** Залогировать исключение. */
export function captureException(err: unknown, ctx?: CrashReporterContext): void {
  if (isDev) {
    const tag = ctx?.tag ? `[${ctx.tag}] ` : '';
    console.warn(`[crashReporter] ${tag}`, err, ctx?.extra ?? '');
  }
  if (!sentry) return;
  try {
    sentry.captureException(err, {
      tags: ctx?.tag ? { source: ctx.tag } : undefined,
      extra: ctx?.extra,
    });
  } catch {
    // Телеметрия молчит, приложение живёт.
  }
}

/** Залогировать сообщение (не-Error). */
export function captureMessage(
  msg: string,
  level: CrashReporterLevel = 'info',
  ctx?: CrashReporterContext,
): void {
  if (isDev) {
    const tag = ctx?.tag ? `[${ctx.tag}] ` : '';
    console.log(`[crashReporter:${level}] ${tag}${msg}`, ctx?.extra ?? '');
  }
  if (!sentry) return;
  try {
    sentry.captureMessage(msg, level);
  } catch {
    /* см. выше */
  }
}

/** Очистить контекст пользователя — при выходе и удалении аккаунта. */
export function clearUserContext(): void {
  if (!sentry) return;
  try {
    sentry.setUser(null);
  } catch {
    /* см. выше */
  }
}

/** Установить контекст пользователя. Только opaque id (Supabase user.id) —
 *  никогда email или телефон. */
export function setUserContext(id: string): void {
  if (!sentry) return;
  try {
    sentry.setUser({ id });
  } catch {
    /* см. выше */
  }
}
