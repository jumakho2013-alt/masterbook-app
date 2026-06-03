import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { cancelAllNotifications } from '@/src/lib/notifications';
import { captureException, clearUserContext } from '@/src/lib/crashReporter';
import { stopAutoSync } from '@/src/lib/cloudSync';

/**
 * Результат удаления аккаунта.
 *
 *   ok=true                                 → серверный + локальный wipe прошли.
 *   ok=true,  serverDeleteFailed=true       → локальные данные стёрты, но RPC
 *                                             не удалила запись в auth.users.
 *                                             UI ОБЯЗАН показать пользователю
 *                                             что нужно дописать в support.
 *                                             Apple Guideline 5.1.1(v): можно
 *                                             выйти, но мы не вправе обмануть
 *                                             что аккаунт полностью удалён.
 *   ok=false                                → произошла фатальная ошибка
 *                                             (даже локальный wipe не успел).
 */
export type DeleteAccountResult =
  | { ok: true; serverDeleteFailed: false }
  | { ok: true; serverDeleteFailed: true; serverError: string }
  | { ok: false; error: string };

/**
 * Удаление аккаунта — обязательное требование App Store (Guideline 5.1.1(v))
 * и Google Play (Data deletion). Если приложение поддерживает регистрацию,
 * должно поддерживать и удаление без обращения в поддержку.
 *
 * Порядок (если Supabase упадёт, локальные данные всё равно стираем —
 * иначе пользователь остаётся со следами после re-install):
 *
 *   1. Отменить все запланированные локальные уведомления.
 *   2. Попросить бэкенд удалить запись (Supabase RPC `delete_user`).
 *      Раньше ошибка тут молча писалась в console.warn — это противоречило
 *      Apple 5.1.1(v): user думал что удалил, а строка в auth.users живёт.
 *      Теперь ошибку RPC возвращаем наверх как serverDeleteFailed, UI
 *      обязан сообщить.
 *   3. supabase.auth.signOut() — чистит локальную сессию.
 *   4. Сбросить in-memory zustand-сторы (всех 6 слоёв) — иначе следующий
 *      пользователь на устройстве увидит данные удалённого аккаунта до
 *      перезапуска приложения.
 *   5. AsyncStorage.clear() — стирает все persisted blobs.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  let serverError: string | null = null;
  const isLocalOnly = useAuthStore.getState().localOnlyMode;

  try {
    // 0. Останавливаем авто-синк сразу — чтобы debounced push не попытался
    //    писать в аккаунт, который мы вот-вот удалим.
    stopAutoSync();

    // 1. Уведомления
    await cancelAllNotifications().catch(() => {});

    // 2. Удаление на сервере — только если есть серверный аккаунт.
    //    В local-only mode (юзер выбрал «Начать без аккаунта») нечего
    //    удалять — нет ни пользователя в auth.users, ни строк в БД.
    if (!isLocalOnly) {
      const { error: rpcError } = await supabase.rpc('delete_user');
      if (rpcError) {
        serverError = rpcError.message;
        captureException(rpcError, { tag: 'deleteAccount.rpc' });
      }

      // 3. Sign out (чистит локальную секрет-сессию). Не падаем если уже
      //    разлогинены / нет сети.
      await supabase.auth.signOut().catch(() => {});
    }

    // 4. In-memory reset всех сторов (auth + бизнес). Делаем ДО
    //    AsyncStorage.clear() чтобы любые активные подписки/listener'ы
    //    видели пустое состояние а не дёргали ключи которые сейчас исчезнут.
    useClientStore.getState().reset();
    useAppointmentStore.getState().reset();
    useFinanceStore.getState().reset();
    useServiceStore.getState().reset();
    useSettingsStore.getState().reset();
    useAuthStore.getState().reset();
    // useAuthStore.reset() сбрасывает только onboarding-поля; user/session
    // явно обнуляем:
    useAuthStore.setState({ user: null, session: null });

    // 5. AsyncStorage — стираем все persisted blobs (masterbook-clients,
    //    -appointments, -finances, -services, -settings, -auth).
    await AsyncStorage.clear();

    clearUserContext();

    if (serverError) {
      return { ok: true, serverDeleteFailed: true, serverError };
    }
    return { ok: true, serverDeleteFailed: false };
  } catch (err) {
    captureException(err, { tag: 'deleteAccount.catastrophic' });
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
