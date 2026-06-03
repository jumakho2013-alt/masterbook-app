import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { MasterBookLogo } from '@/src/components/MasterBookLogo';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/src/theme';
import { Button, Input, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { signUpSchema } from '@/src/lib/validation';

// Ссылка на каноническую версию политики конфиденциальности.
// Должна совпадать с тем что подаётся в Google Play Data Safety / App Store
// privacy URL. Файл-источник: docs/privacy.md (GitHub Pages).
const PRIVACY_POLICY_URL = 'https://jumakho2013-alt.github.io/masterbook-privacy/';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const signUp = useAuthStore((s) => s.signUp);
  const setMasterName = useSettingsStore((s) => s.setMasterName);

  const { alertConfig, error: showError } = useAlert();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  // 152-ФЗ требует явное согласие на обработку персональных данных ДО любой
  // обработки (в т.ч. до отправки на сервер). Default false → кнопка
  // "Зарегистрироваться" недоступна пока не отмечено.
  const [consent, setConsent] = useState(false);
  const setConsentGiven = useAuthStore((s) => s.setConsentGiven);

  const openPrivacyPolicy = () => {
    // expo-web-browser открывает SFSafariViewController / Custom Tabs —
    // пользователь не выходит из приложения, нет риска фишинг-perception.
    WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL).catch(() => {
      showError('Не удалось открыть', 'Скопируйте ссылку: ' + PRIVACY_POLICY_URL);
    });
  };

  const handleRegister = async () => {
    // Guard от double-tap: пока идёт сетевой запрос, повторный submit
    // создал бы 2 запроса signUp → второй вернёт «email уже занят», UX-баг.
    if (loading) return;
    Keyboard.dismiss();
    if (!consent) {
      showError(
        'Нужно согласие',
        'Чтобы продолжить, отметьте согласие на обработку персональных данных.',
      );
      return;
    }
    const parsed = signUpSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.errors) {
        const field = issue.path[0] as 'name' | 'email' | 'password';
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.name);
    setLoading(false);

    if (error) {
      showError('Ошибка', error);
    } else {
      // Фиксируем факт согласия с timestamp — для журнала
      // обработки персональных данных (152-ФЗ ст. 9).
      setConsentGiven(new Date().toISOString());
      setMasterName(parsed.data.name);
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
            Создайте аккаунт
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.form}>
          <Input
            label="Ваше имя"
            placeholder="Мария"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
            error={errors.name}
            autoFocus
          />
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
            placeholder="Минимум 6 символов"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
            error={errors.password}
            secureTextEntry
          />

          {/* 152-ФЗ согласие на обработку персональных данных.
              Без этого галочки кнопка "Зарегистрироваться" недоступна —
              это обязательное требование для российских пользователей. */}
          <Pressable
            onPress={() => setConsent((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            accessibilityLabel="Согласие на обработку персональных данных"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.consentRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: consent ? colors.primary : colors.border,
                  backgroundColor: consent ? colors.primary : 'transparent',
                },
              ]}
            >
              {consent && <Check size={14} color={colors.white} strokeWidth={3} />}
            </View>
            <Text style={[typo.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
              Я согласен(а) на обработку персональных данных в соответствии с{' '}
              <Text
                onPress={openPrivacyPolicy}
                style={{ color: colors.primary, textDecorationLine: 'underline' }}
              >
                Политикой конфиденциальности
              </Text>
            </Text>
          </Pressable>

          <Button
            title="Зарегистрироваться"
            onPress={handleRegister}
            loading={loading}
            disabled={!consent}
            size="lg"
            fullWidth
            style={{ marginTop: sp.sm }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
          <Text style={[typo.body, { color: colors.textSecondary }]}>Уже есть аккаунт?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[typo.bodyBold, { color: colors.primary, marginLeft: 6 }]}>
              Войти
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
