import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import * as LucideIcons from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProfessionCardProps {
  name: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export function ProfessionCard({ name, icon, color, onPress }: ProfessionCardProps) {
  const { colors, typography: typo, spacing: sp, borderRadius: br, shadows: sh } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size: number; color: string }>>)[icon];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      style={[
        animStyle,
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: br.lg,
          borderColor: colors.border,
          ...sh.md,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '15', borderRadius: br.md }]}>
        {IconComponent && <IconComponent size={30} color={color} />}
      </View>
      <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.md, textAlign: 'center' }]}>
        {name}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderWidth: 0.5,
  },
  iconWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
