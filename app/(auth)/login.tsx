import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MasterBookLogo } from '@/src/components/MasterBookLogo';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/src/theme';
import { Button, Input, CustomAlert } from '@/src/components/ui';
import { AppleSignInButton } from '@/src/components/AppleSignInButton';
import { useAlert } from '@/src/hooks/useAlert';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { signInSchema } from '@/src/lib/validation';
import {
  checkAuthRateLimit,
  recordAuthFailure,
  resetAuthRateLimit,
  formatRetryDuration,
} from '@/src/lib/authRateLimit';

// Каноническая Privacy Policy — должна совпадать с register.tsx.
const PRIVACY_POLICY_URL = 'https://jumakho2013-alt.github.io/masterbook-privacy/';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const setConsentGiven = useAuthStore((s) => s.setConsentGiven);
  const dataConsentGivenAt = useAuthStore((s) => s.dataConsentGivenAt);
  const enableLocalOnly = useAuthStore((s) => s.enableLocalOnly);

  const { alertConfig, error: showError, info } = useAlert();

  const openPrivacyPolicy = () => {
    WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL).catch(() => {
      showError('Не удалось открыть', 'Скопируйте ссылку: ' + PRIVACY_POLICY_URL);
    });
  };

  // Фиксируем "implicit" согласие при логине — пользователь нажал кнопку
  // авторизации под disclaimer'ом, это даёт нам timestamp для журнала
  // 152-ФЗ. Если согласие уже зафиксировано на register — не перезаписываем.
  const recordConsentIfNeeded = () => {
    if (!dataConsentGivenAt) setConsentGiven(new Date().toISOString());
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    // Guard от double-tap во время сетевого запроса.
    if (loading) return;
    Keyboard.dismiss();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.errors) {
        const field = issue.path[0] as 'email' | 'password';
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    // Rate limit: если перебрали попыток — не шлём даже на бэкенд
    const rl = await checkAuthRateLimit();
    if (rl.locked) {
      showError('Слишком много попыток', `Подождите ${formatRetryDuration(rl.retryInMs)} и попробуйте снова`);
      return;
    }

    setLoading(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);

    if (error) {
      const next = await recordAuthFailure();
      if (next.locked) {
        showError(
          'Слишком много попыток',
          `Ваш вход временно заблокирован на ${formatRetryDuration(next.retryInMs)}`,
        );
      } else {
        showError('Ошибка', error);
      }
    } else {
      await resetAuthRateLimit();
      recordConsentIfNeeded();
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(600)} style={styles.logo}>
          <MasterBookLogo size={80} />

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

          {/* Apple Sign-In — рендерится только на iOS, где доступен. */}
          <AppleSignInButton
            style={{ marginTop: sp.md }}
            onSuccess={() => {
              recordConsentIfNeeded();
              router.replace('/');
            }}
            onError={(msg) => showError('Apple Sign-In', msg)}
          />

          {/* 152-ФЗ disclaimer. Apple HIG не разрешает чекбокс прямо над Sign in
              with Apple, поэтому используем "implicit consent": нажимая кнопку
              входа/регистрации, пользователь соглашается. Текст обязателен,
              ссылка обязательна, иначе RU-ревью не пропустит. */}
          <Text
            style={[
              typo.small,
              { color: colors.textTertiary, textAlign: 'center', marginTop: sp.md, lineHeight: 16 },
            ]}
          >
            Нажимая «Войти», вы соглашаетесь с{' '}
            <Text
              onPress={openPrivacyPolicy}
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
            >
              обработкой персональных данных
            </Text>
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
          <Text style={[typo.body, { color: colors.textSecondary }]}>Нет аккаунта?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={[typo.bodyBold, { color: colors.primary, marginLeft: 6 }]}>
              Зарегистрироваться
            </Text>
          </Pressable>
        </Animated.View>

        {/* Local-only путь: пользователь хочет без аккаунта, всё локально.
            Для большинства CIS-мастеров это правильный дефолт — 152-ФЗ
            автоматически OK, никаких регистраций, ничего на сервере. */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={{ marginTop: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
            <Text style={[typo.small, { color: colors.textTertiary }]}>или</Text>
            <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
          </View>
          <Pressable
            onPress={() => {
              enableLocalOnly();
              // Ведём прямо в выбор профессии — без промежуточного welcome.
              router.replace('/(auth)/profession');
            }}
            accessibilityRole="button"
            accessibilityLabel="Начать без аккаунта"
            style={{ alignSelf: 'center', paddingVertical: 6 }}
          >
            <Text style={[typo.bodyBold, { color: colors.text }]}>
              Начать без аккаунта
            </Text>
            <Text
              style={[
                typo.small,
                { color: colors.textTertiary, textAlign: 'center', marginTop: 4, lineHeight: 16 },
              ]}
            >
              Данные хранятся только на телефоне.{'\n'}Можно подключить аккаунт позже.
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
