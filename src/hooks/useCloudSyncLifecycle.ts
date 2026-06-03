import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { startAutoSync, stopAutoSync, syncNow } from '@/src/lib/cloudSync';

/**
 * Управляет жизненным циклом облачной синхронизации, реагируя на auth-состояние.
 *
 *   • Есть user и НЕ local-only → стартуем авто-синк + сразу полная синхронизация
 *     (pull чужих изменений + push локальных). Это и есть «восстановление при
 *     входе на новом телефоне».
 *   • Нет user / local-only / logout → останавливаем авто-синк.
 *
 * Монтируется один раз в корне (RootInner), живёт всё время работы приложения.
 * startAutoSync идемпотентен; смена userId (logout→login, A→B) корректно
 * перезапускает синк под новым пользователем.
 */
export function useCloudSyncLifecycle(): void {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const localOnly = useAuthStore((s) => s.localOnlyMode);

  useEffect(() => {
    if (userId && !localOnly) {
      startAutoSync();
      void syncNow();
    } else {
      stopAutoSync();
    }
  }, [userId, localOnly]);
}
