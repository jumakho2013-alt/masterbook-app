import * as Notifications from 'expo-notifications';
import { getNotificationPermissionStatus } from './notifications';
import { rescheduleMissingReminders } from './reminderSync';
import { captureException } from '@/src/lib/crashReporter';
import { t } from '@/src/i18n';
import type { WebBooking } from './webBookingDetect';

export { findNewWebBookings, type WebBooking } from './webBookingDetect';

// Записи с сайта приходят к мастеру обычным синком — и раньше приходили молча:
// ни уведомления, ни напоминания за час (оно ставилось только на холодном
// старте). Мастер узнавал о клиенте, лишь случайно открыв календарь.
//
// Это локальное уведомление после синка: срабатывает, когда мастер открывает
// приложение или оно возвращается из фона. Мгновенный push при закрытом
// приложении требует серверной отправки (Expo push) — отдельная задача.

function shortDate(ymd: string): string {
  const [, m, d] = ymd.split('-');
  return d && m ? `${d}.${m}` : ymd;
}

/** Показать уведомление и поставить напоминания для новых записей. Не бросает. */
export async function notifyNewWebBookings(list: WebBooking[]): Promise<void> {
  if (list.length === 0) return;
  try {
    // Напоминание за час — сразу, а не на следующем холодном старте.
    await rescheduleMissingReminders();
    if ((await getNotificationPermissionStatus()) !== 'granted') return;
    const one = list.length === 1 ? list[0] : null;
    await Notifications.scheduleNotificationAsync({
      content: one
        ? {
            title: t('misc.notifWebBookingTitle'),
            body: t('misc.notifWebBookingBody', {
              name: one.name || '—',
              service: one.service || '—',
              date: shortDate(one.date),
              time: one.time,
            }),
            data: { type: 'web_booking', appointmentId: one.id },
            sound: 'default',
          }
        : {
            title: t('misc.notifWebBookingsTitle', { count: list.length }),
            body: t('misc.notifWebBookingsBody'),
            data: { type: 'web_booking' },
            sound: 'default',
          },
      trigger: null,
    });
  } catch (e) {
    captureException(e, { tag: 'notifications.webBooking' });
  }
}
