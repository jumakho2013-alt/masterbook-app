import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

/**
 * useNotificationDeepLink — слушает тап на локальное уведомление и роутит
 * в соответствующий экран.
 *
 * Поддерживаемые типы (data.type):
 *   • 'appointment_reminder' → /appointment/[id] (data.appointmentId)
 *   • 'morning_summary'      → / (Today) — уже стартовый экран, no-op
 *
 * Также обрабатываем cold start: если приложение запущено тапом на нотификацию
 * (app был полностью убит), getLastNotificationResponseAsync() вернёт её.
 *
 * Подключается ОДИН раз в app/_layout.tsx после монтирования Stack —
 * router должен быть готов до того как мы попробуем router.push().
 */
export function useNotificationDeepLink() {
  const router = useRouter();
  const handledColdStartRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response || !mounted) return;
      const data = response.notification.request.content.data as
        | { type?: string; appointmentId?: string }
        | null;
      if (!data) return;

      if (data.type === 'appointment_reminder' && data.appointmentId) {
        // expo-router типизирует динамические сегменты строго — приводим к
        // правильному формату пути с as const.
        router.push({
          pathname: '/appointment/[id]',
          params: { id: data.appointmentId },
        });
      }
      // morning_summary: ничего не делаем, юзер уже видит Today.
    };

    // Cold-start: приложение только что запущено тапом на уведомление.
    if (!handledColdStartRef.current) {
      handledColdStartRef.current = true;
      Notifications.getLastNotificationResponseAsync()
        .then(handle)
        .catch(() => {
          // На старых Android getLast иногда падает — не критично, активный
          // listener ниже обработает следующие тапы.
        });
    }

    // Активный listener для тапов когда app уже работает (background/foreground).
    const sub = Notifications.addNotificationResponseReceivedListener(handle);

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [router]);
}
