import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { CalendarClock, X, Check } from 'lucide-react-native';
import * as Haptics from '@/src/lib/haptics';
import { useTheme } from '@/src/theme';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { syncDeleteEvent } from '@/src/lib/calendarSync';
import { useT } from '@/src/hooks/useT';
import { formatCurrency } from '@/src/utils/currency';
import type { Appointment, Client, Service } from '@/src/types';

interface Props {
  appointment: Appointment;
  client?: Client;
  service?: Service;
  onPress?: () => void;
  onQuickComplete?: () => void;
}

const SERIF = 'CormorantGaramond_600SemiBold';

function durationMin(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

/**
 * Плоская серифная строка расписания — точно по макету Atelier (Today):
 * время серифом в левой колонке | хайрлайн | услуга + клиент | цена серифом.
 * Свайп влево (для запланированных) сохраняет функции: Провести / Перенести /
 * Отменить — визуально строка остаётся чистой, без видимых кнопок (как у него).
 */
export function AtelierScheduleRow({ appointment, client, service, onPress, onQuickComplete }: Props) {
  const { colors, typography: typo } = useTheme();
  const router = useRouter();
  const tr = useT();
  const setStatus = useAppointmentStore((s) => s.setStatus);
  const swipeRef = useRef<Swipeable>(null);

  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'no-show';
  const dur = durationMin(appointment.startTime, appointment.endTime);

  const row = (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: colors.background, opacity: isCancelled ? 0.5 : 1 }]}>
      <View style={styles.timeCol}>
        <Text style={{ fontFamily: SERIF, fontSize: 21, letterSpacing: -0.2, color: colors.text }}>{appointment.startTime}</Text>
        <Text style={[typo.label, { color: colors.textTertiary, marginTop: 1 }]}>{tr('today.minShort', { n: dur })}</Text>
      </View>
      <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
      <View style={{ flex: 1 }}>
        <Text
          style={[typo.bodyBold, { color: colors.text, textDecorationLine: isCancelled ? 'line-through' : 'none' }]}
          numberOfLines={1}
        >
          {service?.name ?? tr('components.serviceFallback')}
        </Text>
        <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
          {client?.name ?? tr('components.clientFallback')}
        </Text>
      </View>
      <Text style={{ fontFamily: SERIF, fontSize: 18, color: isCompleted ? colors.success : colors.text }}>
        {formatCurrency(appointment.price)}
      </Text>
    </Pressable>
  );

  // Свайп-действия только у запланированных записей.
  if (appointment.status !== 'scheduled') return row;

  const close = () => swipeRef.current?.close();

  const onComplete = () => {
    close();
    onQuickComplete?.();
  };
  const onReschedule = () => {
    close();
    Haptics.selectionAsync();
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
      <Pressable onPress={onComplete} accessibilityRole="button" accessibilityLabel={tr('components.apptMarkComplete')}
        style={[styles.actionBtn, { backgroundColor: colors.success }]}>
        <Check size={20} color="#FFFFFF" strokeWidth={2.4} />
        <Text style={[typo.label, { color: '#FFFFFF', marginTop: 4 }]}>{tr('today.swipeDone')}</Text>
      </Pressable>
      <Pressable onPress={onReschedule} accessibilityRole="button" accessibilityLabel={tr('components.swipeReschedule')}
        style={[styles.actionBtn, { backgroundColor: colors.info }]}>
        <CalendarClock size={20} color="#FFFFFF" />
        <Text style={[typo.label, { color: '#FFFFFF', marginTop: 4 }]}>{tr('components.swipeReschedule')}</Text>
      </Pressable>
      <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel={tr('components.swipeCancel')}
        style={[styles.actionBtn, { backgroundColor: colors.danger }]}>
        <X size={20} color="#FFFFFF" />
        <Text style={[typo.label, { color: '#FFFFFF', marginTop: 4 }]}>{tr('components.swipeCancel')}</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} friction={2} rightThreshold={40} overshootRight={false}>
      {row}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 8 },
  timeCol: { width: 58 },
  vDivider: { width: StyleSheet.hairlineWidth, height: 34, marginRight: 14 },
  actionsRow: { flexDirection: 'row' },
  actionBtn: { width: 78, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
});
