import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
  Linking,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BellRing, MessageCircle, BatteryWarning } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, CustomAlert, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { buildReminderMessage, defaultReminderTemplate } from '@/src/lib/reminderTemplate';
import {
  registerForPushNotifications,
  scheduleDailyClientReminderPrompt,
  cancelDailyClientReminderPrompt,
} from '@/src/lib/notifications';

const CHANNELS = ['whatsapp', 'sms'] as const;

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
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const toast = useToast();
  const { alertConfig, error: showError } = useAlert();

  const enabled = useSettingsStore((s) => s.autoClientReminders);
  const setEnabled = useSettingsStore((s) => s.setAutoClientReminders);
  const savedTemplate = useSettingsStore((s) => s.reminderTemplate);
  const setReminderTemplate = useSettingsStore((s) => s.setReminderTemplate);
  const channel = useSettingsStore((s) => s.reminderChannel);
  const setReminderChannel = useSettingsStore((s) => s.setReminderChannel);
  const [requesting, setRequesting] = useState(false);

  // Текст шаблона — локально + сохраняем в стор. Пусто → дефолт (null).
  const [templateText, setTemplateText] = useState(savedTemplate ?? defaultReminderTemplate());
  const onTemplateChange = (text: string) => {
    setTemplateText(text);
    setReminderTemplate(text.trim() ? text : null);
  };
  const insertToken = (token: string) => {
    Haptics.selectionAsync();
    onTemplateChange(templateText.trim() ? `${templateText} ${token}` : token);
  };
  const resetTemplate = () => {
    Haptics.selectionAsync();
    setTemplateText(defaultReminderTemplate());
    setReminderTemplate(null);
  };

  const previewMsg = buildReminderMessage(templateText, {
    name: 'Анна',
    time: '14:00',
    service: 'Маникюр',
  });
  const tokens = [
    tr('settings.tplTokenName'),
    tr('settings.tplTokenTime'),
    tr('settings.tplTokenService'),
  ];

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
                <Text style={[typo.caption, { color: colors.primary, fontFamily: 'Manrope_700Bold' }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[typo.body, { color: colors.text, flex: 1 }]}>{step}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Важно: ничего не уходит само */}
        <Text
          style={[
            typo.small,
            { color: colors.textTertiary, marginTop: sp.md, paddingHorizontal: 4, lineHeight: 18 },
          ]}
        >
          {tr('settings.remindersNote')}
        </Text>

        {/* Текст напоминания — мастер задаёт сам */}
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.lg, marginBottom: 4 }]}>
          {tr('settings.tplTitle')}
        </Text>
        <Text style={[typo.caption, { color: colors.textSecondary, marginBottom: sp.sm }]}>
          {tr('settings.tplHint')}
        </Text>
        <TextInput
          value={templateText}
          onChangeText={onTemplateChange}
          multiline
          style={[
            typo.body,
            styles.tplInput,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md },
          ]}
          placeholderTextColor={colors.textTertiary}
        />
        <View style={styles.tokenRow}>
          <Text style={[typo.caption, { color: colors.textTertiary }]}>{tr('settings.tplInsert')}</Text>
          {tokens.map((tk) => (
            <TouchableOpacity
              key={tk}
              onPress={() => insertToken(tk)}
              style={[styles.tokenChip, { backgroundColor: colors.primarySoft, borderRadius: br.sm }]}
            >
              <Text style={[typo.caption, { color: colors.primary }]}>{tk}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={resetTemplate} style={{ paddingVertical: 6 }} accessibilityRole="button">
          <Text style={[typo.caption, { color: colors.textSecondary }]}>{tr('settings.tplReset')}</Text>
        </TouchableOpacity>

        {/* Живой предпросмотр */}
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.lg, marginBottom: sp.sm }]}>
          {tr('settings.remindersPreviewTitle')}
        </Text>
        <GlassCard>
          <View style={styles.bubbleRow}>
            <View style={[styles.bubbleIcon, { backgroundColor: colors.successSoft }]}>
              <MessageCircle size={16} color={colors.success} />
            </View>
            <View style={[styles.bubble, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[typo.body, { color: colors.text }]}>{previewMsg}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Канал отправки — куда откроется сообщение */}
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.lg, marginBottom: sp.sm }]}>
          {tr('settings.channelTitle')}
        </Text>
        <View style={styles.channelRow}>
          {CHANNELS.map((ch) => {
            const active = channel === ch;
            return (
              <TouchableOpacity
                key={ch}
                onPress={() => {
                  Haptics.selectionAsync();
                  setReminderChannel(ch);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.channelBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: br.md,
                  },
                ]}
              >
                <Text style={[typo.bodyBold, { color: active ? colors.white : colors.text }]}>
                  {ch === 'whatsapp' ? tr('settings.channelWhatsapp') : tr('settings.channelSms')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

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
              <Text style={[typo.caption, { color: colors.primary, fontFamily: 'Manrope_700Bold' }]}>
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
  tplInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tokenChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 10,
  },
  channelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
});

