import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { CalendarClock, X } from 'lucide-react-native';
import * as Haptics from '@/src/lib/haptics';
import { useTheme } from '@/src/theme';
import { AppointmentCard } from '@/src/components/AppointmentCard';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { syncDeleteEvent } from '@/src/lib/calendarSync';
import { useT } from '@/src/hooks/useT';
import type { Appointment, Client, Service } from '@/src/types';

interface Props {
  appointment: Appointment;
  client?: Client;
  service?: Service;
  onPress?: () => void;
  onQuickComplete?: () => void;
}

/**
 * Swipeable-обёртка для AppointmentCard на экране «Сегодня» (фидбэк: «чтобы
 * всё было максимально легко управляемо»). Свайп влево → 2 действия:
 *   • Перенести → открывает запись сразу в режиме переноса времени
 *   • Отменить  → confirm и статус cancelled (+ удаление из календаря)
 *
 * Свайп показываем только у запланированных записей — у завершённых/отменённых
 * действия не нужны (рендерим обычную карточку).
 */
export function SwipeableAppointmentCard({
  appointment,
  client,
  service,
  onPress,
  onQuickComplete,
}: Props) {
  const { colors, typography: typo } = useTheme();
  const router = useRouter();
  const tr = useT();
  const setStatus = useAppointmentStore((s) => s.setStatus);
  const swipeRef = useRef<Swipeable>(null);

  const card = (
    <AppointmentCard
      appointment={appointment}
      client={client}
      service={service}
      onPress={onPress}
      onQuickComplete={onQuickComplete}
    />
  );

  // У не-запланированных записей свайп-действия не нужны.
  if (appointment.status !== 'scheduled') return card;

  const close = () => swipeRef.current?.close();

  const onReschedule = () => {
    close();
    Haptics.selectionAsync();
    // Открываем карточку сразу в режиме переноса (param читается в detail).
    router.push(`/appointment/${appointment.id}?reschedule=1`);
  };

  const onCancel = () => {
    close();
    Alert.alert(tr('appt.cancel.confirmTitle'), tr('appt.cancel.confirmBody'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('appt.cancel.confirmBtn'),
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setStatus(appointment.id, 'cancelled');
          if (appointment.calendarEventId) syncDeleteEvent(appointment.calendarEventId);
        },
      },
    ]);
  };

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      <Pressable
        onPress={onReschedule}
        accessibilityRole="button"
        accessibilityLabel={tr('components.swipeReschedule')}
        style={[styles.actionBtn, { backgroundColor: colors.info }]}
      >
        <CalendarClock size={20} color="#FFFFFF" />
        <Text style={[typo.small, { color: '#FFFFFF', marginTop: 4 }]}>
          {tr('components.swipeReschedule')}
        </Text>
      </Pressable>
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={tr('components.swipeCancel')}
        style={[styles.actionBtn, { backgroundColor: colors.danger }]}
      >
        <X size={20} color="#FFFFFF" />
        <Text style={[typo.small, { color: '#FFFFFF', marginTop: 4 }]}>
          {tr('components.swipeCancel')}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={{ backgroundColor: colors.background }}>{card}</View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row' },
  actionBtn: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
