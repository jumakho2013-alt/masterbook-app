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
import { useT } from '@/src/hooks/useT';
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
  const t = useT();

  const { alertConfig, error: showError, info } = useAlert();

  const openPrivacyPolicy = () => {
    WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL).catch(() => {
      showError(t('common.openFailed'), t('common.copyLink', { url: PRIVACY_POLICY_URL }));
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
      showError(t('auth.tooManyAttempts'), t('auth.tooManyAttemptsWait', { duration: formatRetryDuration(rl.retryInMs) }));
      return;
    }

    setLoading(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);

    if (error) {
      const next = await recordAuthFailure();
      if (next.locked) {
        showError(
          t('auth.tooManyAttempts'),
          t('auth.loginBlocked', { duration: formatRetryDuration(next.retryInMs) }),
        );
      } else {
        showError(t('common.error'), error);
      }
    } else {
      await resetAuthRateLimit();
      recordConsentIfNeeded();
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(600)} style={styles.logo}>
          <MasterBookLogo size={80} />

          <Text style={[typo.h1, { color: colors.text, marginTop: sp.md }]}>MasterBook</Text>
          <Text style={[typo.body, { color: colors.textSecondary, marginTop: sp.xs }]}>
            {t('auth.loginSubtitle')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
          <Input
            label={t('auth.email')}
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label={t('auth.password')}
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
            error={errors.password}
            secureTextEntry
          />

          <Pressable
            onPress={() => info(t('auth.forgotPassword'), t('auth.forgotPasswordBody'))}
            style={{ alignSelf: 'flex-end' }}
          >
            <Text style={[typo.caption, { color: colors.primary }]}>{t('auth.forgotPassword')}</Text>
          </Pressable>

          <Button
            title={t('auth.login')}
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
            onError={(msg) => showError(t('auth.appleSignIn'), msg)}
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
            {t('auth.loginConsentPrefix')}
            <Text
              onPress={openPrivacyPolicy}
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
            >
              {t('auth.consentProcessing')}
            </Text>
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
          <Text style={[typo.body, { color: colors.textSecondary }]}>{t('auth.noAccount')}</Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={[typo.bodyBold, { color: colors.primary, marginLeft: 6 }]}>
              {t('auth.register')}
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
            <Text style={[typo.small, { color: colors.textTertiary }]}>{t('auth.or')}</Text>
            <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
          </View>
          <Pressable
            onPress={() => {
              enableLocalOnly();
              // Ведём прямо в выбор профессии — без промежуточного welcome.
              router.replace('/(auth)/profession');
            }}
            accessibilityRole="button"
            accessibilityLabel={t('auth.startWithoutAccount')}
            style={{ alignSelf: 'center', paddingVertical: 6 }}
          >
            <Text style={[typo.bodyBold, { color: colors.text }]}>
              {t('auth.startWithoutAccount')}
            </Text>
            <Text
              style={[
                typo.small,
                { color: colors.textTertiary, textAlign: 'center', marginTop: 4, lineHeight: 16 },
              ]}
            >
              {t('auth.startWithoutAccountHint')}
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
