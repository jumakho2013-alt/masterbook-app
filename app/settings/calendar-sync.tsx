import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CalendarSync as CalendarSyncIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { requestCalendarSync, disableCalendarSync } from '@/src/lib/calendarSync';

/**
 * Calendar sync settings.
 *
 * При первом включении — запрос permission через requestCalendarSync().
 * Если permission denied — toggle возвращается обратно, юзер видит сообщение
 * «Открой Настройки → MasterBook → Календарь».
 */
export default function CalendarSyncSettingsScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const toast = useToast();
  const { alertConfig, error: showError } = useAlert();

  const enabled = useSettingsStore((s) => s.calendarSyncEnabled);
  const setEnabled = useSettingsStore((s) => s.setCalendarSyncEnabled);
  const [requesting, setRequesting] = useState(false);

  const onToggle = async (value: boolean) => {
    Haptics.selectionAsync();
    if (!value) {
      disableCalendarSync();
      toast.success('Синхронизация выключена');
      return;
    }
    setRequesting(true);
    try {
      const ok = await requestCalendarSync();
      if (!ok) {
        showError(
          'Нужен доступ к календарю',
          'Открой Настройки → MasterBook → Календарь и разреши доступ. После этого вернись и включи переключатель.',
        );
        return;
      }
      setEnabled(true);
      toast.success('Синхронизация включена');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel="Назад"
        />
        <Text style={[typo.h3, { color: colors.text }]}>Календарь устройства</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center', marginBottom: sp.lg }}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <CalendarSyncIcon size={32} color={colors.primary} />
          </View>
        </View>

        <Text
          style={[
            typo.body,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: sp.lg, paddingHorizontal: 16 },
          ]}
        >
          Записи будут появляться в системном календаре телефона. Это удобно — твои визиты видны и на iPhone Calendar, и в Google Calendar, и на Apple Watch.
        </Text>

        <GlassCard style={{ padding: 0 }}>
          <View style={[styles.row, { paddingHorizontal: sp.md, paddingVertical: sp.md }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>
                Синхронизация
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {enabled ? 'Активна — новые записи появляются в календаре' : 'Выключена'}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={onToggle}
              disabled={requesting}
              trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
            />
          </View>
        </GlassCard>

        <Text
          style={[
            typo.small,
            { color: colors.textTertiary, marginTop: sp.md, paddingHorizontal: 16, lineHeight: 18 },
          ]}
        >
          • Создаётся отдельный календарь «MasterBook» — можешь скрыть его в системных настройках в любой момент.{'\n\n'}
          • При отключении уже синхронизированные события остаются в системе. Удалить их можно вручную в системном календаре.{'\n\n'}
          • Это локальная синхронизация — данные не отправляются на наш сервер.
        </Text>
      </ScrollView>

      {/* CustomAlert не показывается без alertConfig.visible — это OK */}
      {alertConfig.visible && null}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
