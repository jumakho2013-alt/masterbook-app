import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function GlassCard({ children, style, elevated = false }: GlassCardProps) {
  const { colors, borderRadius: br, shadows: sh } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.surface : colors.surfaceGlass,
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

const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    padding: 20,
  },
});
