import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors, typography: typo, spacing: sp } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft, borderRadius: 20 }]}>
        {icon}
      </View>
      <Text style={[typo.h3, { color: colors.text, marginTop: sp.lg }]}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            typo.body,
            { color: colors.textSecondary, marginTop: sp.sm, textAlign: 'center', maxWidth: 260 },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
