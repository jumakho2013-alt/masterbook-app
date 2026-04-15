import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  variant?: 'default' | 'primary' | 'ghost';
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  onPress,
  size = 48,
  variant = 'default',
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const { colors, borderRadius: br } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgColors = {
    default: colors.surfaceElevated,
    primary: colors.primary,
    ghost: 'transparent',
  };

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      style={[
        animStyle,
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: br.md,
          backgroundColor: bgColors[variant],
        },
        style,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
