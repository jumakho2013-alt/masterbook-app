import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import {
  CalendarCheck,
  Calendar,
  Users,
  Wallet,
  UserCircle,
} from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';

const TAB_ICONS = [CalendarCheck, Calendar, Users, Wallet, UserCircle];
const TAB_LABELS = ['Сегодня', 'Календарь', 'Клиенты', 'Финансы', 'Профиль'];

function TabItem({
  icon: Icon,
  label,
  focused,
  onPress,
}: {
  icon: typeof CalendarCheck;
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const { colors, typography: typo } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.85, { damping: 15, stiffness: 500 }),
      withSpring(1, { damping: 12, stiffness: 400 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const color = focused ? colors.primary : colors.textTertiary;

  return (
    <Pressable onPress={handlePress} style={styles.tab}>
      <Animated.View style={[styles.tabInner, animStyle]}>
        {focused && (
          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
        )}
        <Icon size={22} color={color} />
        <Text style={[typo.small, { color, marginTop: 3 }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, shadows: sh } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border, ...sh.lg }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <TabItem
            key={route.key}
            icon={TAB_ICONS[index]}
            label={TAB_LABELS[index]}
            focused={focused}
            onPress={() => { if (!focused) navigation.navigate(route.name); }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    flexDirection: 'row',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 44,
  },
  tabInner: {
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: -8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
