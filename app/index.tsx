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
  const checkSession = useAuthStore((s) => s.checkSession);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // No session → login
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
