import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, typography: typo, borderRadius: br, shadows: sh } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bgColors = {
    primary: colors.primary,
    secondary: colors.surfaceElevated,
    ghost: 'transparent',
    danger: colors.danger,
  };

  const textColors = {
    primary: colors.white,
    secondary: colors.text,
    ghost: colors.primary,
    danger: colors.white,
  };

  const heights = { sm: 40, md: 52, lg: 58 };

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animStyle,
        styles.base,
        {
          backgroundColor: bgColors[variant],
          height: heights[size],
          borderRadius: br.md,
          opacity: disabled ? 0.4 : 1,
          ...(variant === 'primary' ? sh.glow : {}),
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text
          style={[
            size === 'sm' ? typo.caption : typo.bodyBold,
            { color: textColors[variant] },
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    alignSelf: 'center',
  },
});
