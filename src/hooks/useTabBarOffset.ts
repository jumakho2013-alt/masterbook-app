import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_CONTENT_HEIGHT } from '@/src/components/GlassTabBar';

/**
 * Bottom offset in points, correctly accounting for the home indicator
 * on modern iPhones (Dynamic Island, notchless iPads, etc). Use for floating
 * elements that must sit just above the tab bar.
 */
export function useTabBarOffset(extra: number = 16): number {
  const insets = useSafeAreaInsets();
  const bottomSafe = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 6);
  return TAB_BAR_CONTENT_HEIGHT + bottomSafe + extra;
}
