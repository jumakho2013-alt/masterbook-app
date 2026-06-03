import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft, Clock, User, Scissors, CalendarPlus,
  MoveRight, StickyNote, Check, X, CameraIcon, MessageCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, Button, Badge, Divider, CustomAlert, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { formatDate, formatTimeRange, toDateKey } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';
import { addMinutes, generateTimeSlots } from '@/src/utils/time';
import { openOutreach, type OutreachChannel } from '@/src/lib/sleepingClients';
import { useProfessionPack } from '@/src/hooks/useProfessionPack';
import { syncUpdateEvent, syncDeleteEvent } from '@/src/lib/calendarSync';

const statusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Запланировано', color: '#7C5DFA' },
  completed: { label: 'Завершено', color: '#2ED573' },
  cancelled: { label: 'Отменено', color: '#FF4757' },
  'no-show': { label: 'Не пришёл', color: '#FFA502' },
};

const REBOOK_OPTIONS = [
  { label: '1 нед', weeks: 1 },
  { label: '2 нед', weeks: 2 },
  { label: '3 нед', weeks: 3 },
  { label: '4 нед', weeks: 4 },
];

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();

  const allAppointments = useAppointmentStore((s) => s.appointments);
  const setStatus = useAppointmentStore((s) => s.setStatus);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const updateAppointment = useAppointmentStore((s) => s.updateAppointment);
  const addEntry = useFinanceStore((s) => s.addEntry);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);
  const workHours = useSettingsStore((s) => s.workHours);

  const { alertConfig, success, confirm, error: showError, show } = useAlert();
  const toast = useToast();

  const appointment = allAppointments.find((a) => a.id === id);
  const client = clients.find((c) => c.id === appointment?.clientId);
  const service = services.find((s) => s.id === appointment?.serviceId);

  // Local state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(appointment?.notes ?? '');

  if (!appointment) return null;

  const status = statusLabels[appointment.status];

  // === HANDLERS ===

  const handleComplete = () => {
    setStatus(appointment.id, 'completed');
    // Auto-add income entry (prevent duplicates)
    const existingEntries = useFinanceStore.getState().entries;
    const alreadyRecorded = existingEntries.some((e) => e.appointmentId === appointment.id);
    if (!alreadyRecorded) {
      addEntry({
        type: 'income',
        amount: appointment.price,
        description: `${service?.name ?? 'Услуга'} — ${client?.name ?? 'Клиент'}`,
        date: appointment.date,
        appointmentId: appointment.id,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Если у мастера есть review-link — предложим попросить отзыв.
    // Иначе обычный success-alert.
    const reviewLink = useSettingsStore.getState().reviewLinkUrl;
    if (reviewLink && client?.phone) {
      show(
        'Готово!',
        'Запись завершена, доход записан.\n\nПопросить отзыв у клиента?',
        [
          { text: 'Позже', style: 'cancel' },
          {
            text: 'Попросить',
            style: 'default',
            onPress: () => askForReview(reviewLink),
          },
        ],
        'success',
      );
    } else {
      success('Готово!', 'Запись завершена, доход записан', () => router.back());
    }
  };

  /** Открывает WhatsApp с готовым текстом «спасибо + ссылка на отзыв».
   *  Если WhatsApp не установлен — fallback на wa.me web. */
  const askForReview = async (reviewLink: string) => {
    if (!client) return;
    const firstName = client.name.split(' ')[0] || client.name;
    const sig = useSettingsStore.getState().masterName
      ? `\n\n— ${useSettingsStore.getState().masterName}`
      : '';
    const msg = `${firstName}, спасибо что пришла! 🌸\n\nЕсли понравилось — буду рада короткому отзыву:\n${reviewLink}${sig}`;
    await openOutreach('whatsapp', client.phone, msg);
    router.back();
  };

  const handleCancel = () => {
    confirm('Отменить запись?', 'Запись будет помечена как отменённая', () => {
      setStatus(appointment.id, 'cancelled');
      // Удаляем из системного календаря — мастер не хочет видеть «зомби» записи.
      if (appointment.calendarEventId) {
        syncDeleteEvent(appointment.calendarEventId);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 'Отменить', true);
  };

  const handleRebook = (weeks: number) => {
    const newDate = new Date(appointment.date);
    newDate.setDate(newDate.getDate() + weeks * 7);
    addAppointment({
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      date: toDateKey(newDate),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: 'scheduled',
      price: appointment.price,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    success('Готово!', `Записано на ${formatDate(toDateKey(newDate))}, ${appointment.startTime}`, () => router.back());
  };

  const handleReschedule = () => {
    if (!rescheduleTime) return;
    const duration = service?.duration ?? 60;
    const newEnd = addMinutes(rescheduleTime, duration);
    const updated = {
      date: toDateKey(rescheduleDate),
      startTime: rescheduleTime,
      endTime: newEnd,
    };
    updateAppointment(appointment.id, updated);

    // Sync обновлённое событие в системный календарь.
    if (appointment.calendarEventId && client && service) {
      syncUpdateEvent(
        appointment.calendarEventId,
        { ...appointment, ...updated },
        client.name,
        service.name,
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Запись перенесена');
    setShowReschedule(false);
  };

  const handleAddPhoto = async () => {
    // Permission check ДО открытия пикера. Если юзер уже отказал — Android
    // сразу вернёт denied, iOS покажет нативный rationale один раз.
    // Без явной проверки launchImageLibraryAsync молча возвращает canceled,
    // и пользователь думает «не работает».
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!req.granted) {
        showError(
          'Нужен доступ к фото',
          'Включи доступ к галерее в Настройках → MasterBook → Фото. Без него нельзя прикрепить фото к записи.',
        );
        return;
      }
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri);
        const existing = appointment.photos ?? [];
        updateAppointment(appointment.id, { photos: [...existing, ...newUris] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      showError('Не удалось открыть галерею', err instanceof Error ? err.message : String(err));
    }
  };

  const handleSaveNotes = () => {
    updateAppointment(appointment.id, { notes: notes.trim() || undefined });
    setEditingNotes(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success('Заметка сохранена');
  };

  // Sheet с выбором канала. Показывается тапом «Напомнить клиенту».
  const [reminderSheetOpen, setReminderSheetOpen] = useState(false);
  const masterName = useSettingsStore((s) => s.masterName);
  const { pack } = useProfessionPack();

  const buildReminderMessage = (): string => {
    if (!client || !service) return '';
    // Используем pack.reminderTemplate.beforeAppointment с подстановкой.
    const template = pack.reminderTemplate.beforeAppointment;
    const firstName = client.name.split(' ')[0] || client.name;
    const date = formatDate(appointment.date);
    const time = appointment.startTime;
    const sig = masterName ? `\n\n— ${masterName}` : '';
    return (
      template
        .replace('{client}', firstName)
        .replace('{day}', date)
        .replace('{time}', time)
        .replace('{service}', service.name.toLowerCase()) + sig
    );
  };

  const remindClient = () => {
    setReminderSheetOpen(true);
  };

  const sendReminder = async (channel: OutreachChannel) => {
    if (!client) return;
    Haptics.selectionAsync();
    const msg = buildReminderMessage();
    if (channel === 'telegram') {
      try {
        await Clipboard.setStringAsync(msg);
        toast.success('Сообщение скопировано');
      } catch {
        /* безопасно: пользователь сможет ввести вручную */
      }
    }
    await openOutreach(channel, client.phone, msg);
    setReminderSheetOpen(false);
  };

  // Date picker days
  const reschedDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start from tomorrow
    return d;
  });

  const timeSlots = generateTimeSlots(workHours.start, workHours.end, 30);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <Text style={[typo.h3, { color: colors.text }]}>Запись</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <View style={{ alignItems: 'center', marginBottom: sp.lg }}>
          <Badge label={status.label} color={status.color} />
        </View>

        {/* Info card */}
        <GlassCard elevated style={styles.infoCard}>
          <InfoRow icon={<User size={18} color={colors.primary} />} label="Клиент" value={client?.name ?? ''} />
          <InfoRow icon={<Scissors size={18} color={colors.primary} />} label="Услуга" value={service?.name ?? ''} />
          <InfoRow icon={<Clock size={18} color={colors.primary} />} label="Время" value={`${formatDate(appointment.date)}, ${formatTimeRange(appointment.startTime, appointment.endTime)}`} />
          <View style={styles.infoRow}>
            <Text style={[typo.bodyBold, { color: colors.text }]}>Стоимость</Text>
            <Text style={[typo.h3, { color: colors.primary }]}>{formatCurrency(appointment.price)}</Text>
          </View>
        </GlassCard>

        {/* === NOTES SECTION === */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.sectionHeader, { marginTop: sp.lg }]}>
            <StickyNote size={18} color={colors.textSecondary} />
            <Text style={[typo.bodyBold, { color: colors.text, marginLeft: 8 }]}>Заметка</Text>
          </View>
          {editingNotes ? (
            <GlassCard style={{ marginTop: sp.sm }}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Хочет как в прошлый раз, аллергия на..."
                placeholderTextColor={colors.textTertiary}
                style={[typo.body, { color: colors.text, minHeight: 80, textAlignVertical: 'top' }]}
                multiline
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button title="Сохранить" onPress={handleSaveNotes} size="sm" style={{ flex: 1 }} />
                <Button title="Отмена" onPress={() => { setEditingNotes(false); setNotes(appointment.notes ?? ''); }} variant="ghost" size="sm" style={{ flex: 1 }} />
              </View>
            </GlassCard>
          ) : (
            <Pressable onPress={() => setEditingNotes(true)} style={[styles.notesBox, { backgroundColor: colors.surfaceElevated, borderRadius: br.md, marginTop: sp.sm }]}>
              <Text style={[typo.body, { color: appointment.notes ? colors.text : colors.textTertiary }]}>
                {appointment.notes || 'Нажмите чтобы добавить заметку...'}
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* === SCHEDULED ACTIONS === */}
        {appointment.status === 'scheduled' && (
          <Animated.View entering={FadeInDown.delay(200)}>
            {!showReschedule ? (
              <>
                {/* Напомнить клиенту через мессенджер — главная gap-фича
                    из конкурентного анализа. Использует тот же openOutreach
                    что и SleepingClientsCard (WhatsApp/Telegram/SMS). */}
                {client?.phone ? (
                  <Pressable
                    onPress={() => remindClient()}
                    accessibilityRole="button"
                    accessibilityLabel="Напомнить клиенту о записи"
                    style={[
                      styles.remindRow,
                      {
                        backgroundColor: colors.primarySoft,
                        borderRadius: br.md,
                        marginTop: sp.lg,
                      },
                    ]}
                  >
                    <MessageCircle size={18} color={colors.primary} />
                    <Text style={[typo.bodyBold, { color: colors.primary, marginLeft: 10, flex: 1 }]}>
                      Напомнить клиенту
                    </Text>
                    <Text style={[typo.small, { color: colors.primary, opacity: 0.7 }]}>
                      WhatsApp · SMS
                    </Text>
                  </Pressable>
                ) : null}

                <View style={[styles.actions, { marginTop: sp.md }]}>
                  <Button title="Завершить" onPress={handleComplete} variant="primary" size="lg" style={{ flex: 1 }} />
                  <Button title="Перенести" onPress={() => setShowReschedule(true)} variant="secondary" size="lg" style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              /* Reschedule picker */
              <GlassCard elevated style={{ marginTop: sp.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MoveRight size={18} color={colors.primary} />
                  <Text style={[typo.bodyBold, { color: colors.text }]}>Перенести на</Text>
                </View>
                {/* Date picker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {reschedDays.map((d) => {
                    const key = toDateKey(d);
                    const selected = toDateKey(rescheduleDate) === key;
                    return (
                      <Pressable key={key} onPress={() => setRescheduleDate(d)}
                        style={[styles.dateChip, { backgroundColor: selected ? colors.primary : colors.surfaceElevated, borderRadius: br.sm, marginRight: 6 }]}>
                        <Text style={[typo.small, { color: selected ? colors.white : colors.textSecondary }]}>
                          {formatDate(key)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {/* Time slots */}
                <View style={[styles.timeSlotsGrid, { marginTop: 12 }]}>
                  {timeSlots.map((t) => {
                    const selected = rescheduleTime === t;
                    return (
                      <Pressable key={t} onPress={() => setRescheduleTime(t)}
                        style={[styles.timeSlot, { backgroundColor: selected ? colors.primary : colors.surfaceElevated, borderRadius: br.sm }]}>
                        <Text style={[typo.caption, { color: selected ? colors.white : colors.text }]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <Button title="Перенести" onPress={handleReschedule} disabled={!rescheduleTime} size="md" style={{ flex: 1 }} />
                  <Button title="Отмена" onPress={() => setShowReschedule(false)} variant="ghost" size="md" style={{ flex: 1 }} />
                </View>
              </GlassCard>
            )}

            <Button title="Отменить запись" onPress={handleCancel} variant="danger" size="md" style={{ marginTop: 12, alignSelf: 'stretch' }} fullWidth />
          </Animated.View>
        )}

        {/* === COMPLETED: REBOOK === */}
        {appointment.status === 'completed' && (
          <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: sp.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CalendarPlus size={18} color={colors.primary} />
              <Text style={[typo.bodyBold, { color: colors.text }]}>Записать снова</Text>
            </View>
            <View style={styles.rebookGrid}>
              {REBOOK_OPTIONS.map((opt) => (
                <Pressable key={opt.weeks} onPress={() => handleRebook(opt.weeks)}
                  style={[styles.rebookChip, { backgroundColor: colors.primarySoft, borderRadius: br.md }]}>
                  <Text style={[typo.bodyBold, { color: colors.primary }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* === PHOTOS === */}
        {(appointment.status === 'completed' || (appointment.photos?.length ?? 0) > 0) && (
          <Animated.View entering={FadeInDown.delay(300)} style={{ marginTop: sp.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CameraIcon size={18} color={colors.primary} />
                <Text style={[typo.bodyBold, { color: colors.text }]}>Фото работы</Text>
              </View>
              <Pressable onPress={handleAddPhoto} style={{ padding: 4 }}>
                <Text style={[typo.caption, { color: colors.primary }]}>+ Добавить</Text>
              </Pressable>
            </View>
            {(appointment.photos?.length ?? 0) > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {appointment.photos!.map((uri, i) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    // expo-image делает cache на диске + декомпрессию в native
                    // слое. Memory-cache по умолчанию, transition — лёгкий
                    // fade чтобы новые фото не возникали резко.
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    transition={150}
                    accessibilityLabel={`Фото работы ${i + 1}`}
                    style={[styles.photo, { borderRadius: br.md, borderColor: colors.border }]}
                  />
                ))}
              </ScrollView>
            ) : (
              <Pressable
                onPress={handleAddPhoto}
                style={[styles.addPhotoBox, { backgroundColor: colors.surfaceElevated, borderRadius: br.md, borderColor: colors.border }]}
              >
                <CameraIcon size={24} color={colors.textTertiary} />
                <Text style={[typo.caption, { color: colors.textTertiary, marginTop: 6 }]}>
                  Нажмите чтобы добавить фото
                </Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <CustomAlert {...alertConfig} />

      {/* Reminder channel picker — bottom sheet */}
      <ReminderSheet
        visible={reminderSheetOpen}
        onClose={() => setReminderSheetOpen(false)}
        clientName={client?.name ?? ''}
        message={buildReminderMessage()}
        onSend={sendReminder}
        onCopy={async () => {
          await Clipboard.setStringAsync(buildReminderMessage());
          toast.success('Сообщение скопировано');
          setReminderSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

import { Modal, Pressable as RNPressable } from 'react-native';
import { Send, Phone as PhoneIcon, Copy as CopyIcon } from 'lucide-react-native';

function ReminderSheet({
  visible, onClose, clientName, message, onSend, onCopy,
}: {
  visible: boolean;
  onClose: () => void;
  clientName: string;
  message: string;
  onSend: (channel: OutreachChannel) => void;
  onCopy: () => void;
}) {
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={remStyles.backdrop}>
        <RNPressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Закрыть" />
        <View style={[
          remStyles.sheet,
          { backgroundColor: colors.background, borderTopLeftRadius: br.lg, borderTopRightRadius: br.lg },
        ]}>
          <View style={remStyles.handleWrap}>
            <View style={[remStyles.handle, { backgroundColor: colors.border }]} />
          </View>
          <View style={{ paddingHorizontal: sp.lg, paddingBottom: sp.md }}>
            <Text style={[typo.h3, { color: colors.text }]} numberOfLines={1}>
              Напомнить {clientName.split(' ')[0]}
            </Text>
            <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              Выбери канал. Текст уже подготовлен.
            </Text>
          </View>
          <View style={[remStyles.preview, { backgroundColor: colors.surfaceElevated, borderRadius: br.md, marginHorizontal: sp.lg }]}>
            <Text style={[typo.body, { color: colors.text }]}>{message}</Text>
          </View>
          <View style={[remStyles.actionRow, { paddingHorizontal: sp.lg, paddingTop: sp.md, paddingBottom: sp.lg }]}>
            <RemActionBtn label="WhatsApp" bg="#25D36615" iconColor="#25D366"
              icon={<MessageCircle size={20} color="#25D366" />} onPress={() => onSend('whatsapp')} />
            <RemActionBtn label="Telegram" bg="#0088CC15" iconColor="#0088CC"
              icon={<Send size={20} color="#0088CC" />} onPress={() => onSend('telegram')} />
            <RemActionBtn label="SMS" bg={colors.successSoft} iconColor={colors.success}
              icon={<PhoneIcon size={20} color={colors.success} />} onPress={() => onSend('sms')} />
            <RemActionBtn label="Копир." bg={colors.primarySoft} iconColor={colors.primary}
              icon={<CopyIcon size={20} color={colors.primary} />} onPress={onCopy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RemActionBtn({ label, icon, bg, iconColor: _i, onPress }: {
  label: string; icon: React.ReactNode; bg: string; iconColor: string; onPress: () => void;
}) {
  const { colors, typography: typo } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[remStyles.actionBtn, { backgroundColor: bg }]}
    >
      {icon}
      <Text style={[typo.small, { color: colors.text, marginTop: 4 }]}>{label}</Text>
    </Pressable>
  );
}

const remStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { paddingTop: 0 },
  handleWrap: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  preview: { padding: 14 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12,
  },
});

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors, typography: typo } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon}
        <Text style={[typo.caption, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text numberOfLines={1} style={[typo.bodyBold, { color: colors.text, maxWidth: '55%', textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 4 },
  content: { padding: 24 },
  infoCard: { gap: 0 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  notesBox: { padding: 16, minHeight: 60 },
  actions: { flexDirection: 'row', gap: 12 },
  remindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateChip: { paddingHorizontal: 14, paddingVertical: 8 },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeSlot: { paddingHorizontal: 14, paddingVertical: 10, minWidth: 60, alignItems: 'center' },
  rebookGrid: { flexDirection: 'row', gap: 10 },
  rebookChip: { flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  photo: { width: 120, height: 120, marginRight: 10, borderWidth: 0.5 },
  addPhotoBox: { alignItems: 'center', justifyContent: 'center', height: 120, borderWidth: 1, borderStyle: 'dashed' },
});
