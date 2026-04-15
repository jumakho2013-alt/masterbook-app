import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Clock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components/ui';
import type { Appointment, Client, Service } from '@/src/types';
import { formatTimeRange } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AppointmentCardProps {
  appointment: Appointment;
  client?: Client;
  service?: Service;
  onPress?: () => void;
}

export const AppointmentCard = React.memo(function AppointmentCard({
  appointment,
  client,
  service,
  onPress,
}: AppointmentCardProps) {
  const { colors, typography: typo, spacing: sp, borderRadius: br, shadows: sh } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      style={[
        animStyle,
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: br.lg,
          borderColor: colors.border,
          ...sh.sm,
        },
      ]}
    >
      {/* Color indicator line */}
      <View
        style={[
          styles.indicator,
          {
            backgroundColor: service?.color ?? colors.primary,
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
            <Text style={[typo.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
              {formatTimeRange(appointment.startTime, appointment.endTime)}
            </Text>
          </View>
          <Text style={[typo.bodyBold, { color: colors.primary }]}>
            {formatCurrency(appointment.price)}
          </Text>
        </View>

        {/* Service name */}
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: 4 }]}>
          {service?.name ?? 'Услуга'}
        </Text>

        {/* Client row */}
        <View style={[styles.clientRow, { marginTop: sp.md }]}>
          {client && <Avatar name={client.name} size={36} />}
          <Text
            style={[typo.body, { color: colors.text, marginLeft: sp.sm, flex: 1 }]}
            numberOfLines={1}
          >
            {client?.name ?? 'Клиент'}
          </Text>
          <ChevronRight size={18} color={colors.textTertiary} />
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
});
