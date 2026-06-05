import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useT } from '@/src/hooks/useT';

const TAB_ICONS = [CalendarCheck, Calendar, Users, Wallet, UserCircle];
// i18n-ключи (резолвятся в рендере через useT) — порядок = порядок вкладок.
const TAB_KEYS = ['tabs.today', 'tabs.calendar', 'tabs.clients', 'tabs.finances', 'tabs.profile'];

// Minimum iOS tab bar content height (bottom safe-area is added on top).
export const TAB_BAR_CONTENT_HEIGHT = 56;

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
    Haptics.selectionAsync();
    onPress();
  };

  const color = focused ? colors.primary : colors.textTertiary;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={[styles.tabInner, animStyle]}>
        {/* Активная вкладка: pill-фон под иконкой (визуально жирнее
            маленькой точки сверху) + label жирнее. Старый dot был слабым
            сигналом, юзер не сразу понимал где он. */}
        <View style={styles.iconBubble}>
          <Icon size={22} color={color} strokeWidth={focused ? 1.9 : 1.55} />
        </View>
        <Text
          style={[
            typo.small,
            {
              color,
              marginTop: 2,
              fontFamily: focused ? typo.bodyBold.fontFamily : typo.small.fontFamily,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tr = useT();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);

  // Atelier: плоская полупрозрачная панель (surfaceGlass) + верхний хайрлайн,
  // без тяжёлого блюра — чище и легче для бюджетного Android.
  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPad,
          borderTopColor: colors.border,
          backgroundColor: colors.surfaceGlass,
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              icon={TAB_ICONS[index]}
              label={tr(TAB_KEYS[index])}
              focused={focused}
              onPress={() => { if (!focused) navigation.navigate(route.name); }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    minHeight: TAB_BAR_CONTENT_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  tabInner: {
    alignItems: 'center',
  },
  iconBubble: {
    width: 48,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
