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

  // ----- DARK: ровный solid surface (или tint), без blur/specular -----
  if (isDark) {
    const bg = hasTint ? applyAlpha(tint, Math.min(1, tintStrength + 0.06)) : colors.surface;
    return (
      <View
        style={[
          shadowStyle,
          {
            borderRadius: resolvedRadius,
            backgroundColor: bg,
            borderWidth: noRim ? 0 : StyleSheet.hairlineWidth,
            borderColor: colors.border,
            overflow: 'hidden',
          },
          padding !== undefined ? { padding } : null,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // ----- LIGHT: настоящее стекло (blur + лёгкий veil), без грязного glint -----
  const veil = hasTint ? applyAlpha(tint, tintStrength) : 'rgba(255,255,255,0.55)';
  const rimColor = 'rgba(255,255,255,0.85)';

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
      <BlurView tint="light" intensity={intensity} style={StyleSheet.absoluteFill} />
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
