import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/theme';
import { applyAlpha, type LiquidGlassProps } from './LiquidGlass.shared';

/**
 * iOS implementation.
 *
 * ВАЖНО (фидбек юзера «замазка сверху-снизу»): blur + specular-glint на
 * однотонном тёмном фоне создавали грязный вертикальный градиент на больших
 * карточках. Поэтому:
 *
 *   • DARK theme → РОВНАЯ solid заливка surface, без blur, без specular.
 *     Чистая карточка как в Telegram/iOS Settings dark. Никаких пятен.
 *   • LIGHT theme → стекло (blur + лёгкий veil) — там оно реально красиво
 *     и не создаёт грязи на светлом фоне.
 *
 * tint (брендовая заливка — «Сейчас идёт», FAB) работает в обеих темах
 * как ровный полупрозрачный цвет.
 */
export function LiquidGlass({
  children,
  radius,
  tint,
  tintStrength = 0.22,
  intensity = 85,
  variant = 'raised',
  noSpecular: _noSpecular = false,
  noRim = false,
  style,
  padding,
}: LiquidGlassProps) {
  const { colors, isDark, borderRadius: br, shadows: sh } = useTheme();

  const resolvedRadius = radius ?? br.lg;
  const shadowStyle =
    variant === 'ambient' ? undefined : variant === 'floating' ? sh.lg : sh.sm;

  const hasTint = tint !== undefined;

  // Умеренное стекло (выбор юзера ~85% opacity): сквозь карточку чуть видно
  // цветной mesh-фон AppBackground, но текст всегда чёткий. БЕЗ specular-glint
  // (он давал «замазку») — только ровный blur + полупрозрачный veil + rim.
  const veil = hasTint
    ? applyAlpha(tint, Math.min(1, tintStrength + 0.06))
    : isDark
      ? 'rgba(23,32,25,0.82)' // surface #172019 @ 82% — лёгкая стеклянность
      : 'rgba(255,255,255,0.80)';
  const rimColor = isDark ? 'rgba(46,230,166,0.18)' : 'rgba(255,255,255,0.85)';

  return (
    <View
      style={[
        shadowStyle,
        {
          borderRadius: resolvedRadius,
          backgroundColor: 'transparent',
          overflow: 'hidden',
        },
        padding !== undefined ? { padding } : null,
        style,
      ]}
    >
      <BlurView
        tint={isDark ? 'dark' : 'light'}
        intensity={intensity}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: veil }]} />
      {!noRim && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: resolvedRadius,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: rimColor,
            },
          ]}
        />
      )}
      {children}
    </View>
  );
}

export { type LiquidGlassVariant } from './LiquidGlass.shared';
