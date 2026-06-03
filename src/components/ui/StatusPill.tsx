import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '@/src/theme';

export type StatusTone = 'good' | 'warn' | 'bad' | 'neutral';

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  /** Иконка слева. 'check' (по умолчанию для good) | 'up' | 'down' | 'flat' | 'none'. */
  icon?: 'check' | 'up' | 'down' | 'flat' | 'none';
}

/**
 * Статус-пилл как в health-app референсе («✓ Оптимально / Хорошо / Норма»).
 * Полупрозрачная плашка тона + иконка + подпись. Используется на карточках
 * метрик, чтобы мгновенно считывать состояние без чтения цифр.
 */
export function StatusPill({ label, tone = 'good', icon }: StatusPillProps) {
  const { colors, typography: typo, borderRadius: br } = useTheme();

  const toneColor =
    tone === 'good'
      ? colors.success
      : tone === 'warn'
        ? colors.warning
        : tone === 'bad'
          ? colors.danger
          : colors.textSecondary;

  const resolvedIcon = icon ?? (tone === 'good' ? 'check' : 'none');
  const IconCmp =
    resolvedIcon === 'check'
      ? CheckCircle2
      : resolvedIcon === 'up'
        ? TrendingUp
        : resolvedIcon === 'down'
          ? TrendingDown
          : resolvedIcon === 'flat'
            ? Minus
            : null;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: toneColor + '1F', borderRadius: br.sm },
      ]}
    >
      {IconCmp && <IconCmp size={13} color={toneColor} strokeWidth={2.5} />}
      <Text style={[typo.small, { color: toneColor, fontFamily: typo.bodyBold.fontFamily }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
