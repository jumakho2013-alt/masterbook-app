import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { registerForPushNotifications } from '@/src/lib/notifications';

export default function TabLayout() {
  // Ask for notification permission once, when the user first reaches the
  // main app. Errors are swallowed — the feature is optional and must not
  // block the UI.
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

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
