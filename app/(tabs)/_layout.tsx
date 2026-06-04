import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { registerForPushNotifications } from '@/src/lib/notifications';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { SUBSCRIPTION_ENFORCED, getAccessStatus } from '@/src/lib/iap';

export default function TabLayout() {
  const router = useRouter();
  const firstUseAt = useSettingsStore((s) => s.firstUseAt);

  // Ask for notification permission once, when the user first reaches the
  // main app. Errors are swallowed — the feature is optional and must not
  // block the UI.
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

  // Жёсткий paywall: по истечении триала уводим на экран подписки в locked-
  // режиме (без «назад»). Сейчас SUBSCRIPTION_ENFORCED=false → не срабатывает
  // (не запираем пока нет реальной оплаты). После RevenueCat: флаг → true.
  useEffect(() => {
    if (SUBSCRIPTION_ENFORCED && getAccessStatus(firstUseAt) === 'expired') {
      router.replace('/settings/subscription?locked=1');
    }
  }, [firstUseAt, router]);

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
