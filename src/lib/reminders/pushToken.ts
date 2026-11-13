import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { captureException } from '@/src/lib/crashReporter';
import { getNotificationPermissionStatus } from './notifications';

// Push-токен этого телефона на сервере: по нему edge-функция book шлёт мастеру
// уведомление о записи с сайта сразу, даже когда приложение закрыто.
// Токен — свойство устройства, а не аккаунта, поэтому храним его отдельно от
// настроек (их стирает выход из аккаунта) — чтобы при выходе было что отозвать.
const STORAGE_KEY = 'mb-push-token';

function projectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
    ?? (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/**
 * Зарегистрировать токен за текущим аккаунтом. Не бросает: без push приложение
 * работает как раньше (локальное уведомление после синка).
 * Без сессии (local-only) сервер вернёт ошибку — это нормально, молча выходим.
 */
export async function registerPushToken(): Promise<boolean> {
  try {
    if ((await getNotificationPermissionStatus()) !== 'granted') return false;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return false;
    const id = projectId();
    if (!id) return false;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    if (!token) return false;
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (error) throw new Error(error.message);
    await AsyncStorage.setItem(STORAGE_KEY, token);
    return true;
  } catch (e) {
    captureException(e, { tag: 'push.register' });
    return false;
  }
}

/** Отозвать токен перед выходом из аккаунта — иначе push о записях этого
 *  мастера приходили бы на телефон, где он уже вышел. Не дольше 3 секунд:
 *  выход не должен зависать из-за сети. */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEY);
    if (!token) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<void>((resolve) => {
      timer = setTimeout(() => resolve(), 3000);
    });
    try {
      await Promise.race([supabase.rpc('unregister_push_token', { p_token: token }), timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    captureException(e, { tag: 'push.unregister' });
  }
}

/** Есть ли на этом телефоне зарегистрированный токен — тогда о записи уже
 *  пришёл серверный push, и локальное уведомление после синка было бы дублем. */
export async function hasRegisteredPushToken(): Promise<boolean> {
  try {
    return Boolean(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}
