import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useTheme } from '@/src/theme';
import { supabase } from '@/src/lib/supabase';

export default function Index() {
  const { colors } = useTheme();
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const onboarded = useAuthStore((s) => s.onboarded);
  const localOnlyMode = useAuthStore((s) => s.localOnlyMode);
  const checkSession = useAuthStore((s) => s.checkSession);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let mounted = true;

    // Subscribe FIRST so any restored session emitted by Supabase during
    // bootstrap is not dropped on the floor. getSession() then syncs the
    // initial state explicitly.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    checkSession();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [checkSession, setSession]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Dev preview — ТОЛЬКО когда явно задан EXPO_PUBLIC_DEV_PREVIEW=1.
  // Никаких heuristic по URL: production-сборка с реальным Supabase URL
  // гарантированно не сработает даже при ошибке в env.
  if (__DEV__ && process.env.EXPO_PUBLIC_DEV_PREVIEW === '1') {
    return <Redirect href="/(tabs)" />;
  }

  // Local-only mode: пользователь выбрал «Начать без аккаунта». Сессии
  // нет, и не нужна — пускаем по onboarding пути дальше.
  if (localOnlyMode) {
    if (!onboarded) return <Redirect href="/(auth)/welcome" />;
    return <Redirect href="/(tabs)" />;
  }

  // No session → login (там есть «Начать без аккаунта» опция)
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Session but not onboarded → welcome
  if (!onboarded) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Session + onboarded → main app
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
