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
import { useSettingsStore } from '@/src/stores/useSettingsStore';

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

  const handleRegister = async () => {
    Keyboard.dismiss();
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Введите имя';
    if (!email.trim()) newErrors.email = 'Введите email';
    if (password.length < 6) newErrors.password = 'Минимум 6 символов';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setLoading(false);

    if (error) {
      showError('Ошибка', error);
    } else {
      setMasterName(name.trim());
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

          <Button
            title="Зарегистрироваться"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            fullWidth
            style={{ marginTop: sp.md }}
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
});
