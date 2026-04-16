import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/theme';
import { applyAlpha, type LiquidGlassProps } from './LiquidGlass.shared';

/**
 * Android implementation — no BlurView.
 *
 * Rationale:
 *   - `expo-blur` on Android uses a costly shader and shows visible frame
 *     drops on FlatLists and during navigation transitions on mid-range
 *     devices. Shipping it inside of list rows / modals would fail review
 *     smoke tests on Google Play Internal Testing devices.
 *   - Google Play review hardware varies; relying on a native blur means
 *     intermittent "looks broken" reports.
 *
 * We render a solid surface that inherits the theme, then keep the rest of
 * the liquid-glass vocabulary (specular, rim, shadow, tint) so the design
 * language still reads as the same family cross-platform.
 */
export function LiquidGlass({
  children,
  radius,
  tint,
  tintStrength = 0.14,
  // intensity is iOS-only; accepted and ignored to keep the API stable.
  intensity: _intensity,
  variant = 'raised',
  noSpecular = false,
  noRim = false,
  style,
  padding,
}: LiquidGlassProps) {
  const { colors, isDark, borderRadius: br, shadows: sh } = useTheme();

  const resolvedRadius = radius ?? br.lg;
  const shadowStyle =
    variant === 'ambient' ? undefined : variant === 'floating' ? sh.lg : sh.sm;

  // When a brand tint is given we blend it onto the theme surface so the
  // veil reads as "tinted glass" and not a translucent overlay on void.
  // For neutral cards we fall back to the surface colour directly.
  const background =
    tint !== undefined
      ? applyAlpha(tint, Math.min(1, tintStrength + 0.05)) ?? colors.surface
      : colors.surface;

  const specTop = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.35)';
  const specBot = 'rgba(255,255,255,0)';
  const rimColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)';

  return (
    <View
      style={[
        shadowStyle,
        {
          borderRadius: resolvedRadius,
          backgroundColor: background,
          overflow: 'hidden',
        },
        padding !== undefined ? { padding } : null,
        style,
      ]}
    >
      {!noSpecular && (
        <LinearGradient
          pointerEvents="none"
          colors={[specTop, specBot]}
          locations={[0, 0.55]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
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
