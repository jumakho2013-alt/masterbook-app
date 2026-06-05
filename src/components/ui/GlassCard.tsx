import React from 'react';
import { View, StyleSheet, type ViewStyle, type ColorValue } from 'react-native';
import { useTheme } from '@/src/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Чуть более выраженная тень (md вместо sm). */
  elevated?: boolean;
  /** Сплошная заливка для брендовых карточек (напр. плам-карточка «Сейчас идёт»).
   *  Когда задан — бордер убирается, фон = tint. */
  tint?: ColorValue;
  // Сохранены для обратной совместимости API (25 мест) — в Atelier не влияют:
  // тяжёлый Liquid Glass заменён плоской карточкой с хайрлайном.
  tintStrength?: number;
  variant?: string;
  solid?: boolean;
}

/**
 * Atelier: основная карточка — ПЛОСКАЯ. Surface + хайрлайн (0.5px border) +
 * мягкая тень, радиус 18–20. Тяжёлый блюр (LiquidGlass) ретайрнут для обычных
 * карточек — он читался «дёшево» и ронял FPS на бюджетном Android.
 */
export function GlassCard({ children, style, elevated = false, tint }: GlassCardProps) {
  const { colors, borderRadius: br, shadows: sh } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tint ?? colors.surface,
          borderColor: tint ? 'transparent' : colors.border,
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

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
});
