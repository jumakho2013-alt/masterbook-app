import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

const TAB_ICONS = [CalendarCheck, Calendar, Users, Wallet, UserCircle];
const TAB_LABELS = ['Сегодня', 'Календарь', 'Клиенты', 'Финансы', 'Профиль'];

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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);

  const canBlur = Platform.OS === 'ios';
  // Tint veil — deepens the blurred background so text never sits on a
  // muddy backdrop. Tuned per colour scheme.
  const veil = isDark ? 'rgba(19,19,26,0.55)' : 'rgba(255,255,255,0.65)';
  // Top-edge specular — a thin, bright glint catching the rim of the bar.
  const specTop = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPad,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
          backgroundColor: canBlur ? 'transparent' : colors.surface,
        },
      ]}
    >
      {canBlur && (
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={80}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Veil — pulls the blurred content toward the theme surface */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: veil }]}
      />
      {/* Specular — a thin glint on the top rim that reads as "liquid" */}
      {canBlur && (
        <LinearGradient
          pointerEvents="none"
          colors={[specTop, 'rgba(255,255,255,0)']}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.4 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.row}>
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
  activeDot: {
    position: 'absolute',
    top: -8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
