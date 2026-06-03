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
import { initCrashReporter } from '@/src/lib/crashReporter';
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

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
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
      </Stack>
    </>
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
    <ThemeProvider>
      <ToastProvider>
        <BiometricGate>
          <RootInner />
        </BiometricGate>
      </ToastProvider>
    </ThemeProvider>
  );
}
