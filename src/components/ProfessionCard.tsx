import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import * as LucideIcons from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProfessionCardProps {
  name: string;
  icon: string;
  color?: string;
  selected?: boolean;
  onPress: () => void;
}

/**
 * Atelier-карточка профессии (онбординг): иконка-тайл (плам, монохром) + лейбл.
 * Выбранная — 1.5px плам-рамка + чек-бейдж в углу (точно по макету).
 */
export function ProfessionCard({ name, icon, selected = false, onPress }: ProfessionCardProps) {
  const { colors, typography: typo, isDark } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>>)[icon];
  const onPrimary = isDark ? '#2A2030' : '#FFFFFF';

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected }}
      onPressIn={() => { if (!reduceMotion) scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { if (!reduceMotion) scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      style={[
        animStyle,
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: selected ? colors.primary : colors.primarySoft }]}>
        {IconComponent && <IconComponent size={20} color={selected ? onPrimary : colors.primary} strokeWidth={1.6} />}
      </View>
      <Text style={[typo.bodyBold, { color: colors.text, marginTop: 12 }]}>{name}</Text>
      {selected && (
        <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
          <Check size={13} color={onPrimary} strokeWidth={2.4} />
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    minHeight: 92,
    justifyContent: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
