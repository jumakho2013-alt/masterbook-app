import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { AlertTriangle, Copy, RotateCw } from 'lucide-react-native';
import { useTheme } from '@/src/theme';

interface ErrorScreenProps {
  error: Error;
  retry: () => void;
}

/**
 * Fallback-экран для `expo-router` ErrorBoundary. Без него пользователь на
 * production получает белый экран смерти — хуже не бывает.
 *
 * Даёт две вещи:
 *   1. Понятный UX: «Что-то пошло не так», CTA «Попробовать снова».
 *   2. Диагностику: разворачивающийся stack trace + кнопка копирования —
 *      мастер может скинуть в поддержку, не ставя ничего специального.
 */
export function ErrorScreen({ error, retry }: ErrorScreenProps) {
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const version = Constants.expoConfig?.version ?? '—';
  const platform = `${Platform.OS} ${Platform.Version}`;

  const copyDiagnostics = async () => {
    const payload = [
      `MasterBook v${version}`,
      `Platform: ${platform}`,
      `Error: ${error.name}: ${error.message}`,
      '',
      'Stack:',
      error.stack ?? '(no stack)',
    ].join('\n');
    await Clipboard.setStringAsync(payload);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: colors.dangerSoft, borderRadius: br.lg }]}>
          <AlertTriangle size={36} color={colors.danger} />
        </View>
        <Text style={[typo.h2, { color: colors.text, marginTop: sp.md, textAlign: 'center' }]}>
          Что-то пошло не так
        </Text>
        <Text style={[typo.body, { color: colors.textSecondary, marginTop: sp.xs, textAlign: 'center' }]}>
          Приложение наткнулось на ошибку. Попробуйте снова — если не помогло,
          скопируйте диагностику и напишите в поддержку.
        </Text>
      </View>

      <ScrollView
        style={styles.stack}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typo.caption, { color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
          Диагностика
        </Text>
        <View style={[styles.traceBox, { backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}>
          <Text
            style={[
              typo.caption,
              { color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
            ]}
            selectable
          >
            {error.name}: {error.message}
            {'\n'}
            {error.stack}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={copyDiagnostics}
          accessibilityRole="button"
          accessibilityLabel="Скопировать диагностику"
          style={[styles.btnSecondary, { backgroundColor: colors.surfaceElevated, borderRadius: br.md }]}
        >
          <Copy size={18} color={colors.text} />
          <Text style={[typo.bodyBold, { color: colors.text, marginLeft: 8 }]}>Копировать</Text>
        </Pressable>
        <Pressable
          onPress={retry}
          accessibilityRole="button"
          accessibilityLabel="Перезапустить приложение"
          style={[styles.btnPrimary, { backgroundColor: colors.primary, borderRadius: br.md }]}
        >
          <RotateCw size={18} color={colors.white} />
          <Text style={[typo.bodyBold, { color: colors.white, marginLeft: 8 }]}>Попробовать снова</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  icon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    flex: 1,
    marginTop: 16,
  },
  traceBox: {
    padding: 14,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});

/**
 * expo-router требует экспорт `ErrorBoundary` с default-рендерингом
 * `{ error, retry }`. Оборачиваем наш экран чтобы он жил в теме.
 */
export function RouterErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
