import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/theme';
import { applyAlpha, type LiquidGlassProps } from './LiquidGlass.shared';

/**
 * iOS implementation — четырёхслойный liquid-glass:
 *   1. BlurView backdrop (настоящее размытие контента за поверхностью)
 *   2. Tint veil (прозрачный бренд или нейтральный)
 *   3. Тонкий edge-glint на верхней кромке (имитирует преломление света
 *      только по самому краю — НЕ растягивается до центра, иначе на
 *      однотонных тёмных фонах превращается в банальный top-to-bottom
 *      градиент и выдаёт флэт-дизайн)
 *   4. Inner rim — hairline граница изнутри
 *
 * Android использует отдельный файл без BlurView.
 */
export function LiquidGlass({
  children,
  radius,
  tint,
  tintStrength = 0.22,
  intensity = 85,
  variant = 'raised',
  noSpecular = false,
  noRim = false,
  style,
  padding,
}: LiquidGlassProps) {
  const { isDark, borderRadius: br, shadows: sh } = useTheme();

  const resolvedRadius = radius ?? br.lg;
  const shadowStyle =
    variant === 'ambient' ? undefined : variant === 'floating' ? sh.lg : sh.sm;

  const veil =
    tint !== undefined
      ? applyAlpha(tint, tintStrength)
      : isDark
        ? 'rgba(30,30,46,0.32)'
        : 'rgba(255,255,255,0.38)';

  // Edge glint — только самая верхняя кромка (до 12% высоты).
  // Для tinted поверхностей (primary / brand) специально слабее — иначе
  // на однотонной заливке читается как простой градиент, а не как блик.
  const hasTint = tint !== undefined;
  const glintStart = isDark
    ? hasTint
      ? 'rgba(255,255,255,0.14)'
      : 'rgba(255,255,255,0.22)'
    : hasTint
      ? 'rgba(255,255,255,0.28)'
      : 'rgba(255,255,255,0.5)';
  const glintEnd = 'rgba(255,255,255,0)';

  const rimColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)';

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

      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: veil }]}
      />

      {!noSpecular && (
        <LinearGradient
          pointerEvents="none"
          colors={[glintStart, glintEnd]}
          locations={[0, 0.12]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

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
