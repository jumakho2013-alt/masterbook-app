import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Avatar, Badge } from '@/src/components/ui';
import type { Client } from '@/src/types';
import { daysSince } from '@/src/utils/date';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const tagLabels: Record<string, { label: string; color: string }> = {
  vip: { label: 'VIP', color: '#FFA502' },
  problematic: { label: '!', color: '#FF4757' },
  new: { label: 'Новый', color: '#2ED573' },
};

interface ClientRowProps {
  client: Client;
  lastVisitDate?: string;
  onPress?: () => void;
}

export const ClientRow = React.memo(function ClientRow({ client, lastVisitDate, onPress }: ClientRowProps) {
  const { colors, typography: typo, spacing: sp } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      style={[animStyle, styles.container]}
    >
      <Avatar name={client.name} photoUri={client.photoUri} />
      <View style={[styles.info, { marginLeft: sp.md }]}>
        <View style={styles.nameRow}>
          <Text style={[typo.bodyBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {client.name}
          </Text>
          {client.tags.map((tag) => {
            const t = tagLabels[tag];
            return t ? <Badge key={tag} label={t.label} color={t.color} /> : null;
          })}
        </View>
        {lastVisitDate && (
          <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 3 }]}>
            {daysSince(lastVisitDate)}
          </Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
