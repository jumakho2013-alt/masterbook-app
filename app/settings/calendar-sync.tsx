import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CalendarSync as CalendarSyncIcon } from 'lucide-react-native';
import * as Haptics from '@/src/lib/haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, useToast, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
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
  const tr = useT();
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
      toast.success(tr('settings.calendarSyncDisabled'));
      return;
    }
    setRequesting(true);
    try {
      const ok = await requestCalendarSync();
      if (!ok) {
        showError(
          tr('settings.calendarPermissionTitle'),
          tr('settings.calendarPermissionBody'),
        );
        return;
      }
      setEnabled(true);
      toast.success(tr('settings.calendarSyncEnabled'));
    } finally {
      setRequesting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel={tr('common.back')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('settings.calendarTitle')}</Text>
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
          {tr('settings.calendarIntro')}
        </Text>

        <GlassCard style={{ padding: 0 }}>
          <View style={[styles.row, { paddingHorizontal: sp.md, paddingVertical: sp.md }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>
                {tr('settings.calendarSync')}
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {enabled ? tr('settings.calendarSyncActive') : tr('settings.calendarSyncOff')}
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
          {`• ${tr('settings.calendarNoteSeparate')}`}{'\n\n'}
          {`• ${tr('settings.calendarNoteKeepEvents')}`}{'\n\n'}
          {`• ${tr('settings.calendarNoteLocal')}`}
        </Text>
      </ScrollView>

      <CustomAlert {...alertConfig} />
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
