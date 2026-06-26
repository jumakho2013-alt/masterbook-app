import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/theme';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import * as Haptics from '@/src/lib/haptics';

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
  const { colors, shadows: sh, isDark } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (reduceMotion) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Atelier dark: primary — золотой металлик-градиент с тёмным текстом.
  const goldButton = isDark && variant === 'primary';

  const bgColors = {
    primary: colors.primary,
    secondary: colors.surfaceElevated,
    ghost: 'transparent',
    danger: colors.danger,
  };

  const textColors = {
    primary: goldButton ? '#2A2030' : colors.white,
    secondary: colors.text,
    ghost: colors.primary,
    danger: colors.white,
  };

  const heights = { sm: 44, md: 54, lg: 58 };
  const radius = 16;

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
          backgroundColor: goldButton ? 'transparent' : bgColors[variant],
          height: heights[size],
          borderRadius: radius,
          opacity: disabled ? 0.4 : 1,
          ...(variant === 'primary' ? sh.glow : {}),
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {goldButton && (
        // borderRadius на самом градиенте клипит его углы без overflow:hidden —
        // иначе обрезался бы glow-shadow родителя.
        <LinearGradient
          colors={['#E6C588', '#C79B57']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      )}
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text numberOfLines={1} style={[styles.label, { color: textColors[variant] }]}>
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
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15.5,
    letterSpacing: 0.2,
  },
});
