import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronRight, Star } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Avatar } from '@/src/components/ui';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { useT } from '@/src/hooks/useT';
import { formatCurrency } from '@/src/utils/currency';
import type { Client } from '@/src/types';
import { daysSince } from '@/src/utils/date';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Визуальные сигналы по тегам:
//   VIP → золотой ободок на avatar
//   problematic → красная вертикальная полоса слева
//   new → зелёный pulse-dot в углу avatar
// Это устраняет проблему «все клиенты выглядят одинаково» из ревью Маши.

interface ClientRowProps {
  client: Client;
  lastVisitDate?: string;
  onPress?: () => void;
}

export const ClientRow = React.memo(function ClientRow({ client, lastVisitDate, onPress }: ClientRowProps) {
  const { colors, typography: typo, spacing: sp } = useTheme();
  const reduceMotion = useReduceMotion();
  const tr = useT();
  const scale = useSharedValue(1);

  const isVIP = client.tags.includes('vip');
  const isProblematic = client.tags.includes('problematic');
  const isNew = client.tags.includes('new');
  const hasDebt = (client.debt ?? 0) > 0;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Композитный a11y label — VoiceOver прочитает всё как одну кнопку.
  const a11yLabel = [
    client.name,
    isVIP && 'VIP',
    isProblematic && tr('components.clientTagProblematic'),
    isNew && tr('components.clientTagNew'),
    hasDebt && tr('components.clientDebtA11y', { amount: formatCurrency(client.debt!) }),
    lastVisitDate && tr('components.clientLastVisitA11y', { date: lastVisitDate }),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        if (reduceMotion) return;
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        if (reduceMotion) return;
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={tr('components.clientOpenProfileHint')}
      style={[animStyle, styles.container]}
    >
      {/* Красная вертикальная полоса слева — для problematic клиентов.
          Видно мгновенно при скролле, не нужно читать badges. */}
      {isProblematic && (
        <View style={[styles.problemBar, { backgroundColor: colors.danger }]} pointerEvents="none" />
      )}

      {/* Atelier: монограмма-аватар. VIP — золотая звезда у имени, «Новый» —
          зелёный пилюль-бейдж (оба в nameRow ниже). */}
      <Avatar name={client.name} photoUri={client.photoUri} size={40} />

      <View style={[styles.info, { marginLeft: sp.md }]}>
        <View style={styles.nameRow}>
          <Text style={[typo.bodyBold, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>
            {client.name}
          </Text>
          {isVIP && <Star size={14} color={colors.gold} fill={colors.gold} />}
          {isNew && (
            <View style={[styles.pill, { backgroundColor: colors.successSoft }]}>
              <Text style={[typo.label, { color: colors.success }]}>{tr('components.clientTagNew')}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {/* Долг — красная сумма серифом (Atelier: деньги всегда серифом). */}
          {hasDebt && (
            <Text style={[typo.numberMd, { color: colors.danger }]}>
              −{formatCurrency(client.debt!)}
            </Text>
          )}
        </View>
        {lastVisitDate ? (
          <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 3 }]}>
            {daysSince(lastVisitDate)}
          </Text>
        ) : (
          <Text style={[typo.caption, { color: colors.textTertiary, marginTop: 3 }]}>
            {tr('components.clientNeverVisited')}
          </Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    position: 'relative',
  },
  problemBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
