import { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { registerForPushNotifications } from '@/src/lib/notifications';
import { useAuthStore } from '@/src/stores/useAuthStore';

export default function TabLayout() {
  // Auth-guard. Сюда попадают только через index (session || localOnly уже
  // подтверждены), поэтому при монтировании ложного редиректа нет. Но если
  // сессия ПРОПАЛА уже внутри вкладок — signOut, удаление аккаунта, выход с
  // биометрик-экрана, протухший токен — нужно реактивно уйти на вход. Без
  // этого signOut() чистил сторы, но экран оставался на вкладке Профиль →
  // Apple 2.1(a): «no action took place when we tapped to sign out».
  const session = useAuthStore((s) => s.session);
  const localOnly = useAuthStore((s) => s.localOnlyMode);
  const loading = useAuthStore((s) => s.loading);

  // Ask for notification permission once, when the user first reaches the
  // main app. Errors are swallowed — the feature is optional and must not
  // block the UI.
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

  if (!loading && !session && !localOnly) {
    return <Redirect href="/(auth)/login" />;
  }

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
