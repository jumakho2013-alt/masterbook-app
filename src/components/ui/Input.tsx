import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Input({
  label,
  error,
  containerStyle,
  ...props
}: InputProps) {
  const { colors, typography: typo, borderRadius: br } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderProgress = useSharedValue(0);

  const borderAnimStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.danger
      : borderProgress.value > 0
        ? colors.primary
        : colors.border,
  }));

  const handleFocus = () => {
    setFocused(true);
    borderProgress.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    borderProgress.value = withTiming(0, { duration: 200 });
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={[
            typo.caption,
            {
              color: focused ? colors.primary : colors.textSecondary,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <AnimatedView
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.surfaceElevated,
            borderRadius: br.md,
          },
          borderAnimStyle,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            typo.body,
            { color: colors.text },
          ]}
          {...props}
        />
      </AnimatedView>
      {error && (
        <Text style={[typo.small, { color: colors.danger, marginTop: 6 }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    height: 52,
    paddingHorizontal: 18,
  },
});
