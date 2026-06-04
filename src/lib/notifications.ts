import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { captureException } from '@/src/lib/crashReporter';
import { t } from '@/src/i18n';

// Настройка отображения уведомлений когда приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Текущий статус permission'а на нотификации. Используется UI для решения
 *  показывать ли подсказку «включи в настройках». */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'simulator';

let cachedStatus: NotificationPermissionStatus | null = null;

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (cachedStatus) return cachedStatus;
  if (!Device.isDevice) {
    cachedStatus = 'simulator';
    return cachedStatus;
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    cachedStatus = status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    return cachedStatus;
  } catch (err) {
    captureException(err, { tag: 'notifications.getPermissionStatus' });
    return 'undetermined';
  }
}

/** Сбросить кэш — нужно после того как юзер открыл системные настройки и
 *  переключил permission. Иначе мы будем продолжать показывать
 *  «выключено» хотя уже granted. */
export function invalidateNotificationPermissionCache() {
  cachedStatus = null;
}

// Запрос разрешений для локальных уведомлений
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      cachedStatus = 'simulator';
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    cachedStatus = finalStatus === 'granted' ? 'granted' : 'denied';

    if (finalStatus !== 'granted') {
      return false;
    }

    // Android: создаём канал уведомлений
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: t('misc.notifChannel'),
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C5DFA',
        sound: 'default',
      });
    }

    return true;
  } catch (err) {
    captureException(err, { tag: 'notifications.register' });
    return false;
  }
}

// Локальное уведомление — напоминание о записи
export async function scheduleAppointmentReminder(
  appointmentId: string,
  clientName: string,
  serviceName: string,
  date: string, // YYYY-MM-DD
  time: string, // HH:MM
  minutesBefore: number = 60, // за сколько минут до записи
): Promise<string | null> {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const appointmentDate = new Date(year, month - 1, day, hours, minutes);
  const reminderDate = new Date(appointmentDate.getTime() - minutesBefore * 60 * 1000);

  // Не планируем если время уже прошло
  if (reminderDate <= new Date()) {
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: t('misc.notifApptTitle', { min: minutesBefore }),
      body: `${clientName} — ${serviceName}, ${time}`,
      data: { appointmentId, type: 'appointment_reminder' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: 'reminders',
    },
  });

  return id;
}

// Напоминание мастеру утром — сколько записей на сегодня
export async function scheduleMorningReminder(
  count: number,
  firstClientName?: string,
  firstTime?: string,
): Promise<string | null> {
  // Завтра в 8:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  if (count === 0) return null;

  const clientName = firstClientName ?? t('misc.notifClientFallback');
  const body = count === 1
    ? t('misc.notifMorningOne', { name: clientName, time: firstTime ?? '' })
    : t('misc.notifMorningMany', { count, name: clientName, time: firstTime ?? '' });

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: t('misc.notifMorningTitle'),
      body,
      data: { type: 'morning_summary' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tomorrow,
      channelId: 'reminders',
    },
  });

  return id;
}

// Стабильный id ежедневного «разошли напоминания клиентам». Стабильный —
// чтобы пере-планирование перезаписывало, а не плодило дубликаты.
const DAILY_CLIENT_REMINDER_ID = 'daily-client-reminders';

/** Запланировать ежедневное напоминание мастеру вечером: «разошли напоминания
 *  завтрашним клиентам». Идемпотентно (стабильный identifier перезаписывает). */
export async function scheduleDailyClientReminderPrompt(hour = 19, minute = 0): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_CLIENT_REMINDER_ID,
      content: {
        title: t('misc.notifDailyTitle'),
        body: t('misc.notifDailyBody'),
        data: { type: 'client_reminders' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'reminders',
      },
    });
  } catch (err) {
    captureException(err, { tag: 'notifications.dailyClientReminder' });
  }
}

/** Отменить ежедневное напоминание (idempotent, не падает если его нет). */
export async function cancelDailyClientReminderPrompt(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_CLIENT_REMINDER_ID);
  } catch {
    // нет такого запланированного — ок
  }
}

// Отменить конкретное уведомление
export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Отменить все уведомления
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
