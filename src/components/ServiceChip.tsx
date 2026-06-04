import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { useT } from '@/src/hooks/useT';
import type { Service } from '@/src/types';
import { formatCurrency } from '@/src/utils/currency';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ServiceChipProps {
  service: Service;
  selected?: boolean;
  onPress?: () => void;
}

export function ServiceChip({ service, selected = false, onPress }: ServiceChipProps) {
  const { colors, typography: typo, borderRadius: br } = useTheme();
  const reduceMotion = useReduceMotion();
  const tr = useT();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={tr('components.serviceChipA11y', { name: service.name, price: formatCurrency(service.price), duration: service.duration })}
      onPressIn={() => {
        if (reduceMotion) return;
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        if (reduceMotion) return;
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      style={[
        animStyle,
        styles.chip,
        {
          backgroundColor: selected ? service.color + '15' : colors.surface,
          borderColor: selected ? service.color : colors.border,
          borderRadius: br.md,
        },
      ]}
    >
      {/* Color dot */}
      <View style={[styles.dot, { backgroundColor: service.color }]} />
      <View style={styles.textWrap}>
        <Text
          style={[
            typo.bodyBold,
            { color: selected ? service.color : colors.text },
          ]}
          numberOfLines={1}
        >
          {service.name}
        </Text>
        <Text
          style={[
            typo.caption,
            { color: selected ? service.color : colors.textSecondary, marginTop: 2 },
          ]}
        >
          {tr('components.serviceChipDuration', { price: formatCurrency(service.price), duration: service.duration })}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
  },
});
