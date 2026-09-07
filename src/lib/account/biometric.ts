import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/**
 * Обёртка над `expo-local-authentication`. Возвращает семантические
 * результаты чтобы вызывающий код не завязывался на raw-коды ошибок.
 *
 * Хранилище флага включения биометрии — `useSettingsStore.biometricLock`.
 */

export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'unknown' | 'none';

export async function getBiometricKind(): Promise<BiometricKind> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return 'none';
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return 'none';
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'unknown';
}

/**
 * Человекочитаемое название метода — используем в UI подсказках.
 * На iPhone Pro без home-кнопки это всегда Face ID; на iPad / iPhone SE —
 * Touch ID; на Android — «Отпечаток» / «Распознавание лица».
 */
export function biometricLabel(kind: BiometricKind): string {
  if (kind === 'face') return Platform.OS === 'ios' ? 'Face ID' : 'Распознавание лица';
  if (kind === 'fingerprint') return Platform.OS === 'ios' ? 'Touch ID' : 'Отпечаток';
  if (kind === 'iris') return 'Сканирование радужки';
  return 'Биометрия';
}

export interface AuthResult {
  success: boolean;
  /** Пользователь нажал «Отмена» или «Использовать пароль». */
  cancelled: boolean;
  error?: string;
}

export async function authenticate(reason: string): Promise<AuthResult> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      // Разрешаем fallback на device passcode — не создаём fallback в самом
      // приложении, чтобы не хранить пароль локально.
      fallbackLabel: 'Использовать пароль устройства',
      cancelLabel: 'Отмена',
      disableDeviceFallback: false,
    });
    if (res.success) return { success: true, cancelled: false };
    return {
      success: false,
      cancelled: res.error === 'user_cancel' || res.error === 'system_cancel',
      error: res.error,
    };
  } catch (err) {
    return { success: false, cancelled: false, error: String(err) };
  }
}
