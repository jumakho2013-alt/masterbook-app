import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { ThemeProvider, useTheme } from '@/src/theme';
import { ToastProvider } from '@/src/components/ui';
import { BiometricGate } from '@/src/components/BiometricGate';
import { RouterErrorBoundary } from '@/src/components/ErrorScreen';
import { seedDevDataIfNeeded } from '@/src/lib/devSeed';
import { AppBackground } from '@/src/components/AppBackground';
import { initCrashReporter } from '@/src/lib/crashReporter';
import { useNotificationDeepLink } from '@/src/hooks/useNotificationDeepLink';
import { useCloudSyncLifecycle } from '@/src/hooks/useCloudSyncLifecycle';
import { rescheduleMissingReminders } from '@/src/lib/reminderSync';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// Запускаем сразу — должно быть до первого React-рендера, иначе crash до
// init не поймается. initCrashReporter() безопасен без DSN (no-op).
initCrashReporter();

// expo-router распознаёт `ErrorBoundary` экспорт и подсовывает его в качестве
// fallback при необработанной ошибке в любом роуте. Оборачиваем в тему —
// RouterErrorBoundary использует useTheme внутри.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <ThemeProvider>
      <RouterErrorBoundary error={error} retry={retry} />
    </ThemeProvider>
  );
}

SplashScreen.preventAutoHideAsync();

function RootInner() {
  const { isDark, colors } = useTheme();
  // Routes a tapped reminder notification to the corresponding appointment.
  // Должно быть ВНУТРИ Stack-mounting context — router недоступен в RootLayout.
  useNotificationDeepLink();
  // Облачная синхронизация: старт/стоп по auth-состоянию, pull+push при входе.
  useCloudSyncLifecycle();

  // Перепланируем напоминания, потерянные после ребута Android (минус №8).
  // Ждём гидрации persist-стора записей — иначе прочитаем пустой список.
  useEffect(() => {
    const persistApi = useAppointmentStore.persist;
    if (persistApi.hasHydrated()) {
      void rescheduleMissingReminders();
      return;
    }
    const unsub = persistApi.onFinishHydration(() => {
      void rescheduleMissingReminders();
    });
    return unsub;
  }, []);

  return (
    <AppBackground>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          // Прозрачный — сквозь экраны виден корневой mesh-фон (glassmorphism).
          contentStyle: { backgroundColor: 'transparent' },
          // Нативный горизонтальный слайд (как push в iOS). РАНЬШЕ был 'fade':
          // при кросс-фейде двух ПРОЗРАЧНЫХ экранов поверх общего mesh-фона было
          // видно оба экрана разом → «склейка/мерцание». Slide убирает это:
          // новый экран приходит справа поверх старого, без наложения контента.
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="appointment/new"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="client/[id]" />
        <Stack.Screen name="client/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="appointment/[id]" />
        <Stack.Screen name="services/manage" />
        <Stack.Screen name="settings/work-hours" />
        <Stack.Screen name="settings/account" />
        <Stack.Screen name="settings/currency" />
        <Stack.Screen name="settings/review-link" />
        <Stack.Screen name="settings/calendar-sync" />
        <Stack.Screen name="settings/reminders" />
        <Stack.Screen name="settings/language" />
        <Stack.Screen name="finance/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="finance/report" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="reminders-tomorrow" />
      </Stack>
    </AppBackground>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Сначала засеиваем (no-op в production или если сторы непустые),
      // потом прячем сплэш — первый render уже с данными.
      seedDevDataIfNeeded();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ToastProvider>
          <BiometricGate>
            <RootInner />
          </BiometricGate>
        </ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
