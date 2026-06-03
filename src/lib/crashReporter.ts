/**
 * Crash reporter — thin wrapper.
 *
 * v1 (текущее): no-op stub. Все вызовы безопасны, ничего не отправляется
 * никуда. Это нужно чтобы wiring (captureException(...) везде) был на месте
 * заранее — когда добавим Sentry / Bugsnag / Crashlytics, поменяется
 * ТОЛЬКО реализация этого файла.
 *
 * v2 (когда есть DSN):
 *   npx expo install @sentry/react-native
 *   В app.json plugins: [..., "@sentry/react-native/expo"]
 *   В этом файле: вызвать Sentry.init({ dsn, ... }) в initCrashReporter()
 *   и Sentry.captureException(err) в captureException()
 *
 * Wiring уже сделан в этих местах:
 *   - app/_layout.tsx → initCrashReporter() при старте
 *   - src/components/ErrorScreen.tsx → captureException(error)
 *   - src/lib/deleteAccount.ts (rpc fail, sign-out fail)
 *   - src/lib/exportData.ts (file write fail)
 *   - src/lib/taxReportPdf.ts (print fail)
 *   - src/stores/useAuthStore.ts (signOut errors)
 *
 * Privacy guardrails (когда подключим реальный Sentry):
 *   - НИКОГДА не отправлять user.email / phone / client.name / appointment.notes
 *   - Маскировать суммы (amounts) — это PII для самозанятого
 *   - beforeSend hook что фильтрует PII из crumbs
 */

/** Уровень логирования сообщения. Маппится на Sentry severity когда подключим. */
export type CrashReporterLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface CrashReporterContext {
  /** Опциональный тег для категории ошибки (например, 'auth', 'export-pdf'). */
  tag?: string;
  /** Дополнительные ключи (БЕЗ PII — никаких email, phone, имён клиентов!). */
  extra?: Record<string, string | number | boolean>;
}

let initialized = false;

/** `__DEV__` глобал доступен в React Native, но не в jest по умолчанию.
 *  Безопасное чтение — если undefined, считаем что production (no console). */
const isDev = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof __DEV__ !== 'undefined' && (__DEV__ as any);
  } catch {
    return false;
  }
})();

/** Безопасный init — можно звать многократно, no-op без DSN. */
export function initCrashReporter(): void {
  if (initialized) return;
  initialized = true;

  // v1: no-op. Здесь будет Sentry.init({ dsn, environment, ... }).
  // Если EXPO_PUBLIC_SENTRY_DSN не задан — оставляем no-op.
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // dev-only лог — в production вообще тишина.
    if (isDev) {
      console.log('[crashReporter] no DSN — running in no-op mode');
    }
    return;
  }
  // TODO(sentry): когда добавим @sentry/react-native:
  //   Sentry.init({
  //     dsn,
  //     environment: __DEV__ ? 'development' : 'production',
  //     tracesSampleRate: 0.1,
  //     beforeSend: scrubPII,    // фильтр имён/телефонов/email/сумм
  //   });
}

/** Залогировать exception. В no-op режиме — только dev console.warn. */
export function captureException(err: unknown, ctx?: CrashReporterContext): void {
  if (isDev) {
    const tag = ctx?.tag ? `[${ctx.tag}] ` : '';
    console.warn(`[crashReporter] ${tag}`, err, ctx?.extra ?? '');
  }
  // TODO(sentry): Sentry.captureException(err, { tags: { source: ctx?.tag }, extra: ctx?.extra });
}

/** Залогировать сообщение (не-Error). */
export function captureMessage(msg: string, level: CrashReporterLevel = 'info', ctx?: CrashReporterContext): void {
  if (isDev) {
    const tag = ctx?.tag ? `[${ctx.tag}] ` : '';
    console.log(`[crashReporter:${level}] ${tag}${msg}`, ctx?.extra ?? '');
  }
  // TODO(sentry): Sentry.captureMessage(msg, level);
}

/** Очистить контекст пользователя (вызывается на signOut / deleteAccount).
 *  В no-op режиме — ничего; в Sentry режиме — Sentry.setUser(null). */
export function clearUserContext(): void {
  // TODO(sentry): Sentry.setUser(null);
}

/** Установить user context. Передаём НЕ email/phone — только opaque id
 *  (Supabase user.id или 'local-only:<random>'). */
export function setUserContext(id: string): void {
  // TODO(sentry): Sentry.setUser({ id });
}
