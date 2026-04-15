import { Tabs } from 'expo-router';
import { useTheme } from '@/src/theme';
import { GlassTabBar } from '@/src/components/GlassTabBar';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="clients" />
      <Tabs.Screen name="finances" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
