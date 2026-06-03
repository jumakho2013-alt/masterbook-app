import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArrowUpRight, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { CountUp } from '@/src/components/ui';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { formatCurrency } from '@/src/utils/currency';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FinanceMetricCardProps {
  /** Локализованное название («Доход», «Расход», «Чистыми», …). */
  label: string;
  /** Иконка для левого верха. */
  icon: React.ReactNode;
  /** Главное число метрики. Если number — рендерим через CountUp с currency-форматтером.
   *  Если string — рендерим как есть (для "X ч" например). */
  value: number | string;
  /** Опциональный sub-text под числом, например «↑ 12%» или «по 8 визитам». */
  sub?: string;
  /** Цвет акцента — определяет цвет числа + цвет gradient-tint. */
  accentColor: string;
  /** Если задан — карточка кликабельна, показывает chevron + haptic. */
  onPress?: () => void;
  /** Variant — large (полная ширина hero) или compact (треть/половина строки). */
  variant?: 'large' | 'compact';
}

/**
 * Premium-карточка финансовой метрики.
 *
 * Принципиально иначе чем старый «GlassCard + текст»:
 *   1. Реальный 2-stop gradient с tint цвета акцента (visual identity per metric)
 *   2. Большое число (h1 на large, h2 на compact) — главный фокус
 *   3. Иконка в круглой плашке с tint background
 *   4. Стрелка ↗ или chevron справа — явный affordance кликабельности
 *   5. Press animation (scale 0.97) — premium tactile feel
 *   6. Drop shadow + цветной colored shadow для depth
 */
export function FinanceMetricCard({
  label,
  icon,
  value,
  sub,
  accentColor,
  onPress,
  variant = 'compact',
}: FinanceMetricCardProps) {
  const { colors, typography: typo, borderRadius: br, isDark } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!onPress || reduceMotion) return;
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    if (!onPress || reduceMotion) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  const handlePress = () => {
    if (!onPress) return;
    Haptics.selectionAsync();
    onPress();
  };

  // Tint строится от accent: переходим от 14% accent (вверх) к 4% (низ) на
  // surface — даёт реальный «окрашенный стеклянный» feel.
  const tintTop = accentColor + (isDark ? '28' : '20');
  const tintBottom = accentColor + (isDark ? '0E' : '08');

  const valueStyle =
    variant === 'large' ? typo.h1 : typo.h2;

  const cardPadding = variant === 'large' ? 20 : 16;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${typeof value === 'number' ? formatCurrency(value) : value}`}
      style={[
        animStyle,
        styles.card,
        {
          borderRadius: br.lg,
          borderColor: accentColor + '24',
          // Coloured drop-shadow — premium брендовый halo
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.15,
          shadowRadius: 16,
          elevation: 4,
        },
      ]}
    >
      <LinearGradient
        colors={[tintTop, tintBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: br.lg }]}
      />
      {/* Сплошной surface слой ниже gradient — gradient рисуется поверх */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.surface,
            borderRadius: br.lg,
            opacity: isDark ? 0.85 : 0.92,
          },
        ]}
      />
      <View style={{ padding: cardPadding }}>
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: accentColor + '24',
                borderRadius: br.sm,
              },
            ]}
          >
            {icon}
          </View>
          {onPress &&
            (variant === 'large' ? (
              <View
                style={[
                  styles.tapHint,
                  { backgroundColor: accentColor + '18', borderRadius: br.sm },
                ]}
              >
                <Text style={[typo.small, { color: accentColor, fontFamily: typo.bodyBold.fontFamily }]}>
                  Подробнее
                </Text>
                <ArrowUpRight size={14} color={accentColor} />
              </View>
            ) : (
              <ChevronRight size={16} color={accentColor} />
            ))}
        </View>

        <Text
          style={[
            typo.small,
            {
              color: colors.textSecondary,
              marginTop: variant === 'large' ? 12 : 10,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            },
          ]}
        >
          {label}
        </Text>

        {typeof value === 'number' ? (
          <CountUp
            value={value}
            style={{ ...valueStyle, color: accentColor, marginTop: 4 }}
            formatter={(n) => formatCurrency(Math.round(n))}
          />
        ) : (
          <Text style={[valueStyle, { color: accentColor, marginTop: 4 }]}>{value}</Text>
        )}

        {sub ? (
          <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>{sub}</Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBubble: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
