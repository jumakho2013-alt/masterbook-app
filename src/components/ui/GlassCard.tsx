import React from 'react';
import { View, StyleSheet, type ViewStyle, type ColorValue } from 'react-native';
import { useTheme } from '@/src/theme';
import { LiquidGlass, type LiquidGlassVariant } from './LiquidGlass';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** `elevated` keeps the existing API — renders as a floating liquid-glass card. */
  elevated?: boolean;
  /** Optional brand tint for branded cards (e.g. primary for the "Now" card). */
  tint?: ColorValue;
  tintStrength?: number;
  variant?: LiquidGlassVariant;
  /** Opt out of liquid glass for content that needs an opaque background. */
  solid?: boolean;
}

export function GlassCard({
  children,
  style,
  elevated = false,
  tint,
  tintStrength,
  variant,
  solid = false,
}: GlassCardProps) {
  const { colors, borderRadius: br, shadows: sh } = useTheme();

  if (solid) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: br.lg,
            ...(elevated ? sh.md : sh.sm),
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <LiquidGlass
      variant={variant ?? (elevated ? 'floating' : 'raised')}
      tint={tint}
      tintStrength={tintStrength}
      radius={br.lg}
      padding={20}
      style={style}
    >
      {children}
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
});
