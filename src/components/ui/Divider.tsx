import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme';

interface DividerProps {
  style?: ViewStyle;
}

export function Divider({ style }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { height: 1, backgroundColor: colors.border, marginVertical: 16 },
        style,
      ]}
    />
  );
}
