import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { Button, Input, IconButton, useToast } from '@/src/components/ui';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

/**
 * Экран настройки ссылки для отзывов.
 * Поддерживаемые источники (любая URL подходит):
 *   • Yandex Карты / Yandex Бизнес
 *   • Google Maps
 *   • 2GIS
 *   • Instagram (на пост / в директ)
 *   • Avito / любая профильная страница
 *
 * После заполнения — на завершении записи будет кнопка
 * «Попросить отзыв» которая открывает WhatsApp с шаблонным сообщением +
 * этой ссылкой.
 */
export default function ReviewLinkSettingsScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const toast = useToast();
  const existing = useSettingsStore((s) => s.reviewLinkUrl);
  const setReviewLinkUrl = useSettingsStore((s) => s.setReviewLinkUrl);

  const [url, setUrl] = useState(existing ?? '');

  const onSave = () => {
    Keyboard.dismiss();
    const trimmed = url.trim();
    // Валидация: либо пусто (отключить фичу), либо начинается с http(s)
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast.error('URL должен начинаться с http:// или https://');
      return;
    }
    setReviewLinkUrl(trimmed || null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(trimmed ? 'Ссылка сохранена' : 'Ссылка очищена');
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel="Назад"
        />
        <Text style={[typo.h3, { color: colors.text }]}>Ссылка для отзывов</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: sp.lg }}>
          <View style={[styles.heroIcon, { backgroundColor: '#F5C14722' }]}>
            <Star size={32} color="#F5C147" fill="#F5C147" />
          </View>
        </View>

        <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: sp.lg }]}>
          Когда отметишь запись завершённой — появится кнопка «Попросить отзыв». Она откроет WhatsApp с шаблоном благодарности и твоей ссылкой.
        </Text>

        <Input
          label="URL"
          placeholder="https://yandex.ru/maps/..."
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />

        <Text style={[typo.small, { color: colors.textTertiary, marginTop: sp.sm }]}>
          Подходит ссылка на:{'\n'}
          • Карточку в Yandex Картах / Бизнесе{'\n'}
          • Google Maps Reviews{'\n'}
          • 2GIS{'\n'}
          • Instagram (на пост / в direct){'\n'}
          • Avito или любую профильную страницу
        </Text>

        <Button
          title="Сохранить"
          onPress={onSave}
          size="lg"
          fullWidth
          style={{ marginTop: sp.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
