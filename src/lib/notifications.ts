import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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

// Запрос разрешений для локальных уведомлений
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Android: создаём канал уведомлений
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Напоминания',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C5DFA',
        sound: 'default',
      });
    }

    return true;
  } catch (err) {
    console.warn('Notifications setup failed:', err);
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
      title: `Запись через ${minutesBefore} мин`,
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

  const body = count === 1
    ? `1 запись: ${firstClientName ?? 'Клиент'} в ${firstTime ?? ''}`
    : `${count} записей. Первая: ${firstClientName ?? 'Клиент'} в ${firstTime ?? ''}`;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Доброе утро! 📋',
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

// Отменить конкретное уведомление
export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Отменить все уведомления
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
