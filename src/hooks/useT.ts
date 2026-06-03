import { useMemo } from 'react';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { applyLanguage, t as rawT } from '@/src/i18n';

/**
 * React hook для переводов.
 *
 * Использование:
 *   const t = useT();
 *   <Text>{t('profile.title')}</Text>
 *   <Text>{t('auth.consentLabel', { policyLink: '...' })}</Text>
 *
 * При смене языка в settings — все компоненты что используют useT
 * автоматически перерендерятся через подписку на settings store.
 */
export function useT(): (key: string, options?: Record<string, string | number>) => string {
  const language = useSettingsStore((s) => s.language);

  return useMemo(() => {
    applyLanguage(language);
    return (key: string, options?: Record<string, string | number>) => rawT(key, options);
  }, [language]);
}
