import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BookOpen } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Button, Input, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useAuthStore } from '@/src/stores/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const signIn = useAuthStore((s) => s.signIn);

  const { alertConfig, error: showError, info } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    Keyboard.dismiss();
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Введите email';
    if (!password) newErrors.password = 'Введите пароль';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      showError('Ошибка', error);
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(600)} style={styles.logo}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primarySoft }]}>
            <BookOpen size={40} color={colors.primary} />
          </View>
          <Text style={[typo.h1, { color: colors.text, marginTop: sp.md }]}>MasterBook</Text>
          <Text style={[typo.body, { color: colors.textSecondary, marginTop: sp.xs }]}>
            Войдите в аккаунт
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Пароль"
            placeholder="••••••••"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
            error={errors.password}
            secureTextEntry
          />

          <Pressable
            onPress={() => info('Забыли пароль?', 'Напишите нам на support@masterbook.app и мы поможем восстановить доступ')}
            style={{ alignSelf: 'flex-end' }}
          >
            <Text style={[typo.caption, { color: colors.primary }]}>Забыли пароль?</Text>
          </Pressable>

          <Button
            title="Войти"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
            style={{ marginTop: sp.md }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
          <Text style={[typo.body, { color: colors.textSecondary }]}>Нет аккаунта?</Text>
          <Pressable onPress={() => router.push('/(auth)/register' as any)}>
            <Text style={[typo.bodyBold, { color: colors.primary, marginLeft: 6 }]}>
              Зарегистрироваться
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  logo: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  form: { gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
