import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Moon, ChevronRight, X, MessageCircle, Send, Phone, Copy, Check } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, Avatar, useToast } from '@/src/components/ui';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { toDateKey } from '@/src/utils/date';
import {
  findSleepingClients,
  buildDraftMessages,
  openOutreach,
  type SleepingClient,
  type OutreachChannel,
} from '@/src/lib/sleepingClients';

/**
 * Карточка-блок «Спящие клиенты» для Today экрана.
 * Если спящих нет — компонент возвращает null (не съедает место).
 *
 * Открывает action-sheet с тремя вариантами draft-сообщений + кнопками
 * WhatsApp / Telegram / SMS. Telegram pre-fill через URL невозможен,
 * поэтому копируем текст в clipboard и сообщаем тостом.
 */
export function SleepingClientsCard() {
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const clients = useClientStore((s) => s.clients);
  const appointments = useAppointmentStore((s) => s.appointments);
  const services = useServiceStore((s) => s.services);
  const masterName = useSettingsStore((s) => s.masterName);
  const toast = useToast();

  const [selected, setSelected] = useState<SleepingClient | null>(null);

  const sleeping = useMemo(() => {
    const todayKey = toDateKey(new Date());
    return findSleepingClients({
      clients,
      appointments,
      todayKey,
      serviceNameById: (sid) => services.find((s) => s.id === sid)?.name,
    });
  }, [clients, appointments, services]);

  const topThree = sleeping.slice(0, 3);

  const close = useCallback(() => setSelected(null), []);

  if (sleeping.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(200)} style={{ paddingHorizontal: 16, marginBottom: sp.lg }}>
      <View style={styles.header}>
        <Moon size={14} color={colors.textSecondary} />
        <Text
          style={[
            typo.small,
            {
              color: colors.textSecondary,
              marginLeft: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            },
          ]}
        >
          Давно не были · {sleeping.length}
        </Text>
      </View>

      <GlassCard style={{ padding: 0 }}>
        {topThree.map((s, idx) => (
          <Pressable
            key={s.client.id}
            onPress={() => {
              Haptics.selectionAsync();
              setSelected(s);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${s.client.name}, не была ${s.daysSince} дней`}
            style={[
              styles.row,
              idx < topThree.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
          >
            <Avatar name={s.client.name} size={36} />
            <View style={{ flex: 1, marginLeft: sp.md }}>
              <Text style={[typo.body, { color: colors.text }]} numberOfLines={1}>
                {s.client.name}
              </Text>
              <Text style={[typo.small, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                {s.daysSince} дн. · {s.lastServiceName ?? 'визит'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textTertiary} />
          </Pressable>
        ))}
      </GlassCard>

      <DraftSheet
        visible={!!selected}
        item={selected}
        masterName={masterName}
        onClose={close}
        onCopied={() => toast.success('Сообщение скопировано')}
      />
    </Animated.View>
  );
}

// ---------- Action sheet с черновиками ----------

interface DraftSheetProps {
  visible: boolean;
  item: SleepingClient | null;
  masterName: string;
  onClose: () => void;
  onCopied: (message: string) => void;
}

function DraftSheet({ visible, item, masterName, onClose, onCopied }: DraftSheetProps) {
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const [chosenIdx, setChosenIdx] = useState(0);
  const [copying, setCopying] = useState(false);

  const drafts = useMemo(() => {
    if (!item) return [];
    return buildDraftMessages({
      clientName: item.client.name,
      daysSince: item.daysSince,
      lastServiceName: item.lastServiceName,
      masterName: masterName || undefined,
    });
  }, [item, masterName]);

  if (!item) return null;
  const message = drafts[chosenIdx] ?? '';

  const send = async (channel: OutreachChannel) => {
    Haptics.selectionAsync();
    // Telegram URL не поддерживает pre-fill текста → копируем в буфер
    // и сообщаем юзеру, чтобы вставил вручную.
    if (channel === 'telegram') {
      try {
        await Clipboard.setStringAsync(message);
        onCopied(message);
      } catch {
        // Не блокируем открытие — пусть мастер сам напишет.
      }
    }
    await openOutreach(channel, item.client.phone, message);
    onClose();
  };

  const copy = async () => {
    Haptics.selectionAsync();
    setCopying(true);
    try {
      await Clipboard.setStringAsync(message);
      onCopied(message);
    } finally {
      setTimeout(() => setCopying(false), 1200);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Закрыть" />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderTopLeftRadius: br.lg, borderTopRightRadius: br.lg }]}>
          <View style={styles.sheetHandle}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[typo.h3, { color: colors.text }]} numberOfLines={1}>
                {item.client.name}
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {item.daysSince} дн. с последнего визита{item.lastServiceName ? ` · ${item.lastServiceName}` : ''}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Закрыть">
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <Text style={[typo.small, { color: colors.textSecondary, marginBottom: 8 }]}>
              Выбери черновик
            </Text>
            {drafts.map((d, i) => {
              const active = i === chosenIdx;
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setChosenIdx(i);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.draftCard,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primarySoft : colors.surfaceElevated,
                    },
                  ]}
                >
                  <Text style={[typo.body, { color: colors.text }]}>{d}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.actionRow, { paddingBottom: sp.lg }]}>
            <ActionBtn
              icon={<MessageCircle size={20} color="#25D366" />}
              label="WhatsApp"
              bg={'#25D36615'}
              onPress={() => send('whatsapp')}
            />
            <ActionBtn
              icon={<Send size={20} color="#0088CC" />}
              label="Telegram"
              bg={'#0088CC15'}
              onPress={() => send('telegram')}
            />
            <ActionBtn
              icon={<Phone size={20} color={colors.success} />}
              label="SMS"
              bg={colors.success + '15'}
              onPress={() => send('sms')}
            />
            <ActionBtn
              icon={copying ? <Check size={20} color={colors.primary} /> : <Copy size={20} color={colors.primary} />}
              label={copying ? 'OK' : 'Копир.'}
              bg={colors.primarySoft}
              onPress={copy}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ActionBtn({
  icon, label, bg, onPress,
}: { icon: React.ReactNode; label: string; bg: string; onPress: () => void }) {
  const { colors, typography: typo } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.actionBtn, { backgroundColor: bg }]}
    >
      {icon}
      <Text style={[typo.small, { color: colors.text, marginTop: 4 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropTap: { flex: 1 },
  sheet: { paddingTop: 0 },
  sheetHandle: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  draftCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
});
