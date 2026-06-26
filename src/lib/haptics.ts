// Обёртка над expo-haptics с глобальным выключателем вибрации.
//
// Все экраны импортируют Haptics ОТСЮДА (а не из 'expo-haptics'), поэтому одна
// настройка `hapticsEnabled` гасит всю тактильную отдачу разом. API намеренно
// повторяет expo-haptics (selectionAsync/notificationAsync/impactAsync + enum'ы),
// чтобы существующие вызовы `Haptics.selectionAsync()` и т.п. не меняли — меняется
// только путь импорта.
import * as ExpoHaptics from 'expo-haptics';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;
export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;

// По умолчанию включено: пока стор не гидратирован (undefined) — вибрация работает.
// Выключаем только при явном false.
const enabled = (): boolean => useSettingsStore.getState().hapticsEnabled !== false;

export function selectionAsync(): Promise<void> {
  return enabled() ? ExpoHaptics.selectionAsync() : Promise.resolve();
}

export function notificationAsync(type?: ExpoHaptics.NotificationFeedbackType): Promise<void> {
  return enabled() ? ExpoHaptics.notificationAsync(type) : Promise.resolve();
}

export function impactAsync(style?: ExpoHaptics.ImpactFeedbackStyle): Promise<void> {
  return enabled() ? ExpoHaptics.impactAsync(style) : Promise.resolve();
}
