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

  // mesh-фон рисуется глобально в app/_layout (AppBackground под всем Stack).
  // Здесь только делаем scene прозрачной чтобы фон просвечивал.
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: 'transparent' },
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
