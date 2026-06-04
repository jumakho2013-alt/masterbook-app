import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BellRing, MessageCircle, BatteryWarning } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, CustomAlert, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import {
  registerForPushNotifications,
  scheduleDailyClientReminderPrompt,
  cancelDailyClientReminderPrompt,
} from '@/src/lib/notifications';

/**
 * Авто-напоминания клиентам — экран-объяснение (фидбэк: раньше это был «немой»
 * тоггл в профиле, юзер не понимал что включает и какой текст уйдёт).
 *
 * Здесь: что это делает (3 шага), пример сообщения клиенту, и сам тоггл с
 * запросом permission. Сообщения НЕ отправляются автоматически — это лишь
 * вечернее напоминание мастеру + готовый текст в WhatsApp.
 */
export default function RemindersSettingsScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const toast = useToast();
  const { alertConfig, error: showError } = useAlert();

  const enabled = useSettingsStore((s) => s.autoClientReminders);
  const setEnabled = useSettingsStore((s) => s.setAutoClientReminders);
  const [requesting, setRequesting] = useState(false);

  const onToggle = async (value: boolean) => {
    Haptics.selectionAsync();
    if (!value) {
      setEnabled(false);
      await cancelDailyClientReminderPrompt();
      toast.info(tr('settings.remindersOff'));
      return;
    }
    setRequesting(true);
    try {
      const granted = await registerForPushNotifications();
      if (!granted) {
        showError(tr('settings.remindersPermTitle'), tr('settings.remindersPermBody'));
        return;
      }
      setEnabled(true);
      await scheduleDailyClientReminderPrompt();
      toast.success(tr('settings.remindersOn'));
    } finally {
      setRequesting(false);
    }
  };

  const steps = [
    tr('settings.remindersStep1'),
    tr('settings.remindersStep2'),
    tr('settings.remindersStep3'),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel={tr('common.back')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('settings.remindersTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center', marginBottom: sp.lg }}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <BellRing size={32} color={colors.primary} />
          </View>
        </View>

        {/* Тоггл */}
        <GlassCard style={{ padding: 0 }}>
          <View style={[styles.row, { paddingHorizontal: sp.md, paddingVertical: sp.md }]}>
            <View style={{ flex: 1, paddingRight: sp.md }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>
                {tr('settings.remindersToggleLabel')}
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {enabled ? tr('settings.remindersOn') : tr('settings.remindersOff')}
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

        {/* Как это работает */}
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.lg, marginBottom: sp.sm }]}>
          {tr('settings.remindersHowTitle')}
        </Text>
        <GlassCard style={{ gap: sp.md }}>
          {steps.map((step, i) => (
            <View key={i} style={styles.row}>
              <View style={[styles.stepNum, { backgroundColor: colors.primarySoft }]}>
                <Text style={[typo.caption, { color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[typo.body, { color: colors.text, flex: 1 }]}>{step}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Пример сообщения клиенту */}
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.lg, marginBottom: sp.sm }]}>
          {tr('settings.remindersPreviewTitle')}
        </Text>
        <GlassCard>
          <View style={styles.bubbleRow}>
            <View style={[styles.bubbleIcon, { backgroundColor: colors.successSoft }]}>
              <MessageCircle size={16} color={colors.success} />
            </View>
            <View style={[styles.bubble, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[typo.body, { color: colors.text }]}>
                {tr('settings.remindersPreviewMsg')}
              </Text>
            </View>
          </View>
        </GlassCard>

        <Text
          style={[
            typo.small,
            { color: colors.textTertiary, marginTop: sp.md, paddingHorizontal: 4, lineHeight: 18 },
          ]}
        >
          {tr('settings.remindersNote')}
        </Text>

        {/* Android: локальные уведомления глушит агрессивная экономия батареи
            (Xiaomi/Huawei/Samsung/Oppo). Подсказка + переход в настройки. */}
        {Platform.OS === 'android' && (
          <GlassCard style={{ marginTop: sp.lg, gap: sp.sm }}>
            <View style={[styles.row, { gap: sp.sm }]}>
              <BatteryWarning size={20} color={colors.warning} />
              <Text style={[typo.bodyBold, { color: colors.text, flex: 1 }]}>
                {tr('settings.batteryHintTitle')}
              </Text>
            </View>
            <Text style={[typo.caption, { color: colors.textSecondary, lineHeight: 18 }]}>
              {tr('settings.batteryHintBody')}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              accessibilityRole="button"
              style={[styles.batteryBtn, { borderColor: colors.border }]}
            >
              <Text style={[typo.caption, { color: colors.primary, fontFamily: 'PlusJakartaSans_700Bold' }]}>
                {tr('settings.batteryHintButton')}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}
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
  batteryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bubbleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    flex: 1,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
