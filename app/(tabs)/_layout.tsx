import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { AppBackground } from '@/src/components/AppBackground';
import { registerForPushNotifications } from '@/src/lib/notifications';

export default function TabLayout() {
  // Ask for notification permission once, when the user first reaches the
  // main app. Errors are swallowed — the feature is optional and must not
  // block the UI.
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

  // AppBackground рисует mesh-фон под ВСЕ табы. Scene-контейнер прозрачный,
  // экраны тоже прозрачные — сквозь стеклянные карточки виден цветной фон.
  return (
    <AppBackground>
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
    </AppBackground>
  );
}
