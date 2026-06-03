import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/theme';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
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
  const reduceEffects = useSettingsStore((s) => s.reduceEffects);

  const resolvedRadius = radius ?? br.lg;
  const shadowStyle =
    variant === 'ambient' ? undefined : variant === 'floating' ? sh.lg : sh.sm;

  const hasTint = tint !== undefined;

  // Заметное стекло: сквозь карточку реально видно размытый цветной
  // mesh-фон. veil ~72% — стекло видно, текст ещё читается. БЕЗ
  // specular-glint (он давал «замазку») — только ровный blur + veil + rim.
  const veil = hasTint
    ? applyAlpha(tint, Math.min(1, tintStrength + 0.06))
    : isDark
      ? 'rgba(23,32,25,0.72)' // surface #172019 @ 72% — стекло заметное
      : 'rgba(255,255,255,0.72)';
  const rimColor = isDark ? 'rgba(46,230,166,0.20)' : 'rgba(255,255,255,0.9)';

  return (
    <View
      style={[
        shadowStyle,
        {
          borderRadius: resolvedRadius,
          // reduceEffects: сплошная поверхность вместо стекла (без BlurView).
          backgroundColor: reduceEffects ? colors.surface : 'transparent',
          overflow: 'hidden',
        },
        padding !== undefined ? { padding } : null,
        style,
      ]}
    >
      {!reduceEffects && (
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={Math.max(intensity, 90)}
          style={StyleSheet.absoluteFill}
        />
      )}
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
