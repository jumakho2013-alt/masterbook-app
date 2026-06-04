import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet, type ViewStyle } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/src/lib/supabase';
import { useTheme } from '@/src/theme';
import { useT } from '@/src/hooks/useT';

interface AppleSignInButtonProps {
  style?: ViewStyle;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Кнопка «Войти через Apple». На iOS рендерит нативный AppleAuthentication
 * компонент (иконка + текст, стиль устанавливается Apple HIG). На Android
 * не рендерим — Apple Sign-In обязателен только как SSO-альтернатива
 * другим социальным логинам на iOS.
 *
 * Для работы на production нужно:
 *   1. В Apple Developer Console включить capability "Sign in with Apple"
 *      для bundle id.
 *   2. В Supabase Dashboard → Authentication → Providers → Apple включить
 *      и вставить Service ID + ключ .p8. Supabase сам обработает redirect
 *      callback.
 *   3. eas build производит build с корректным entitlement автоматически,
 *      т.к. `expo-apple-authentication` plugin подхватывает capability.
 */
export function AppleSignInButton({ style, onSuccess, onError }: AppleSignInButtonProps) {
  const { isDark, borderRadius: br } = useTheme();
  const tr = useT();
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setSupported);
  }, []);

  if (Platform.OS !== 'ios' || !supported) return null;

  const handle = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // Supabase принимает identityToken (JWT от Apple), обменивает его
      // на свою сессию.
      if (!credential.identityToken) {
        onError?.(tr('components.appleNoToken'));
        return;
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) {
        onError?.(error.message);
        return;
      }
      onSuccess?.();
    } catch (err) {
      if (err instanceof Error && err.message.includes('canceled')) {
        // Пользователь отменил — не показываем ошибку.
        return;
      }
      onError?.(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={
          isDark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={br.md}
        style={styles.button}
        onPress={handle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 52,
  },
});
