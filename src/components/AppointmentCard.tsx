import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Clock, ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components/ui';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { useT } from '@/src/hooks/useT';
import type { Appointment, Client, Service } from '@/src/types';
import { formatTimeRange } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AppointmentCardProps {
  appointment: Appointment;
  client?: Client;
  service?: Service;
  onPress?: () => void;
  /** Включает quick-complete check button справа.
   *  Используется на Today screen для приёма «проведено» одним тапом. */
  onQuickComplete?: () => void;
}

export const AppointmentCard = React.memo(function AppointmentCard({
  appointment,
  client,
  service,
  onPress,
  onQuickComplete,
}: AppointmentCardProps) {
  const { colors, typography: typo, spacing: sp, borderRadius: br, shadows: sh } = useTheme();
  const reduceMotion = useReduceMotion();
  const tr = useT();
  const scale = useSharedValue(1);

  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'no-show';
  const canQuickComplete = onQuickComplete && appointment.status === 'scheduled';

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Композитный a11y label для VoiceOver — иначе читает части отдельно.
  const a11yLabel = [
    `${formatTimeRange(appointment.startTime, appointment.endTime)}`,
    service?.name ?? tr('components.apptServiceA11yFallback'),
    client?.name ?? tr('components.apptClientA11yFallback'),
    formatCurrency(appointment.price),
    isCompleted ? tr('components.apptStatusCompleted') : isCancelled ? tr('components.apptStatusCancelled') : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  const handleQuickComplete = () => {
    if (!onQuickComplete) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onQuickComplete();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        if (reduceMotion) return;
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        if (reduceMotion) return;
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={tr('components.apptOpenDetailsHint')}
      style={[
        animStyle,
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: br.lg,
          borderColor: colors.border,
          opacity: isCancelled ? 0.55 : 1,
          ...sh.sm,
        },
      ]}
    >
      {/* Color indicator line */}
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: isCompleted ? colors.success : (service?.color ?? colors.primary),
            borderTopLeftRadius: br.lg,
            borderBottomLeftRadius: br.lg,
          },
        ]}
      />

      <View style={styles.content}>
        {/* Time + Price row */}
        <View style={styles.topRow}>
          <View style={styles.timeRow}>
            <Clock size={14} color={colors.textSecondary} />
            <Text
              style={[
                typo.caption,
                {
                  color: colors.textSecondary,
                  marginLeft: 4,
                  textDecorationLine: isCancelled ? 'line-through' : 'none',
                },
              ]}
            >
              {formatTimeRange(appointment.startTime, appointment.endTime)}
            </Text>
          </View>
          <Text style={[typo.bodyBold, { color: isCompleted ? colors.success : colors.primary }]}>
            {formatCurrency(appointment.price)}
          </Text>
        </View>

        {/* Service name */}
        <Text
          style={[
            typo.bodyBold,
            {
              color: colors.text,
              marginTop: 4,
              textDecorationLine: isCancelled ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {service?.name ?? tr('components.serviceFallback')}
        </Text>

        {/* Client row */}
        <View style={[styles.clientRow, { marginTop: sp.md }]}>
          {client && <Avatar name={client.name} size={36} />}
          <Text
            style={[typo.body, { color: colors.text, marginLeft: sp.sm, flex: 1 }]}
            numberOfLines={1}
          >
            {client?.name ?? tr('components.clientFallback')}
          </Text>

          {/* Quick-complete check button (только для scheduled-записей сегодня) */}
          {canQuickComplete ? (
            <Pressable
              onPress={handleQuickComplete}
              accessibilityRole="button"
              accessibilityLabel={tr('components.apptMarkComplete')}
              hitSlop={10}
              style={[
                styles.checkBtn,
                {
                  backgroundColor: colors.successSoft,
                  borderColor: colors.success,
                  borderRadius: br.sm,
                },
              ]}
            >
              <Check size={20} color={colors.success} strokeWidth={3} />
            </Pressable>
          ) : isCompleted ? (
            <View
              style={[
                styles.checkBtn,
                {
                  backgroundColor: colors.success,
                  borderColor: colors.success,
                  borderRadius: br.sm,
                },
              ]}
            >
              <Check size={20} color={colors.white} strokeWidth={3} />
            </View>
          ) : (
            <ChevronRight size={18} color={colors.textTertiary} />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  indicator: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
