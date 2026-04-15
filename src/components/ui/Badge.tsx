import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const { colors, typography: typo, borderRadius: br } = useTheme();
  const badgeColor = color ?? colors.primary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColor + '18',
          borderRadius: br.sm,
        },
      ]}
    >
      <Text style={[typo.small, { color: badgeColor, fontFamily: typo.bodyBold.fontFamily }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
