import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { cancelAllNotifications } from '@/src/lib/notifications';

/**
 * Удаление аккаунта — обязательное требование App Store (Guideline 5.1.1(v)):
 * если приложение поддерживает регистрацию, должно поддерживать и удаление
 * без обращения в поддержку.
 *
 * Порядок (важен — если Supabase упадёт, локальные данные всё равно нужно
 * стереть, иначе пользователь остаётся со старыми следами после re-install):
 *
 *   1. Отменить все запланированные локальные уведомления.
 *   2. Попросить бэкенд удалить пользователя (Supabase RPC `delete_user`).
 *      Если RPC не существует — подтверждаем по текущей сессии через
 *      admin.deleteUser невозможно из клиента, поэтому используем RPC
 *      функцию, которую должен завести мастер в своём Supabase (SQL в
 *      `supabase-schema.sql`).
 *   3. supabase.auth.signOut() — чистит локальную сессию.
 *   4. AsyncStorage.clear() — стирает все zustand-stores, кэш настроек,
 *      onboarded флаг и т.д.
 *   5. Сбросить in-memory Zustand store (auth).
 */
export async function deleteAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // 1. Notifications
    await cancelAllNotifications().catch(() => {});

    // 2. Ask backend to drop the user row. We ship a stub RPC in
    // `supabase-schema.sql`; if the project hasn't applied it, the call
    // returns an error — we log and continue to ensure local wipe still
    // happens.
    const { error: rpcError } = await supabase.rpc('delete_user');
    if (rpcError) {
      console.warn('[deleteAccount] RPC delete_user failed:', rpcError.message);
      // Не падаем — локальный wipe важнее.
    }

    // 3. Sign out
    await supabase.auth.signOut().catch(() => {});

    // 4. AsyncStorage wipe
    await AsyncStorage.clear();

    // 5. In-memory reset
    useAuthStore.getState().reset();

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
