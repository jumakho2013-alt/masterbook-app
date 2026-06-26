import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft, Clock, User, Scissors, CalendarPlus,
  MoveRight, StickyNote, Check, X, CameraIcon, MessageCircle, Wallet,
} from 'lucide-react-native';
import * as Haptics from '@/src/lib/haptics';
import * as ImagePicker from 'expo-image-picker';
import { persistImageToAppDir } from '@/src/lib/photoStorage';
import { uploadPhoto } from '@/src/lib/photoCloud';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, Button, Badge, Divider, CustomAlert, useToast, CloudImage } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { formatDate, formatTimeRange, toDateKey } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';
import { addMinutes, generateTimeSlots, timeRangesOverlap } from '@/src/utils/time';
import { openOutreach, type OutreachChannel } from '@/src/lib/sleepingClients';
import { useProfessionPack } from '@/src/hooks/useProfessionPack';
import { syncUpdateEvent, syncDeleteEvent } from '@/src/lib/calendarSync';
import { useT } from '@/src/hooks/useT';

const REBOOK_OPTIONS = [
  { labelKey: 'appt.rebook.week1', weeks: 1 },
  { labelKey: 'appt.rebook.week2', weeks: 2 },
  { labelKey: 'appt.rebook.week3', weeks: 3 },
  { labelKey: 'appt.rebook.week4', weeks: 4 },
];

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const tr = useT();
  const { id, reschedule } = useLocalSearchParams<{ id: string; reschedule?: string }>();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();

  const allAppointments = useAppointmentStore((s) => s.appointments);
  const setStatus = useAppointmentStore((s) => s.setStatus);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const updateAppointment = useAppointmentStore((s) => s.updateAppointment);
  const addEntry = useFinanceStore((s) => s.addEntry);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);
  const workHours = useSettingsStore((s) => s.workHours);
  const bufferMinutes = useSettingsStore((s) => s.bufferMinutes);

  const { alertConfig, success, confirm, error: showError } = useAlert();
  const toast = useToast();

  const appointment = allAppointments.find((a) => a.id === id);
  const client = clients.find((c) => c.id === appointment?.clientId);
  const service = services.find((s) => s.id === appointment?.serviceId);

  // Local state
  // ?reschedule=1 (свайп «Перенести» на Today) — открываем сразу режим переноса.
  const [showReschedule, setShowReschedule] = useState(reschedule === '1');
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(appointment?.notes ?? '');
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [depositInput, setDepositInput] = useState(appointment?.deposit ? String(appointment.deposit) : '');

  if (!appointment) return null;

  // Цвета статусов — из темы (единая гамма). scheduled = info-синий, чтобы не
  // сливаться с completed (success-изумруд). Подписи резолвятся через i18n.
  const statusColors: Record<string, string> = {
    scheduled: colors.info,
    completed: colors.success,
    cancelled: colors.danger,
    'no-show': colors.warning,
  };
  const statusColor = statusColors[appointment.status] ?? colors.textSecondary;
  const statusLabel = tr(`appt.status.${appointment.status}`);

  // Защита от двойной брони при переносе: слот занят, если пересекается (с
  // буфером) с другой запланированной записью на ту же дату. Саму запись
  // исключаем — «перенос на себя» допустим.
  const rescheduleDateKey = toDateKey(rescheduleDate);
  const apptsOnRescheduleDate = allAppointments.filter(
    (a) => a.date === rescheduleDateKey && a.status === 'scheduled' && a.id !== appointment.id,
  );
  const isRescheduleSlotTaken = (t: string): boolean => {
    const dur = service?.duration ?? 60;
    const end = addMinutes(t, dur);
    return apptsOnRescheduleDate.some((a) =>
      timeRangesOverlap(
        t,
        end,
        addMinutes(a.startTime, -bufferMinutes),
        addMinutes(a.endTime, bufferMinutes),
      ),
    );
  };

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
        description: `${service?.name ?? tr('appt.serviceFallback')} — ${client?.name ?? tr('appt.clientFallback')}`,
        date: appointment.date,
        appointmentId: appointment.id,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    success(tr('appt.complete.doneTitle'), tr('appt.complete.doneBody'), () => router.back());
  };

  const handleCancel = () => {
    confirm(tr('appt.cancel.confirmTitle'), tr('appt.cancel.confirmBody'), () => {
      setStatus(appointment.id, 'cancelled');
      // Удаляем из системного календаря — мастер не хочет видеть «зомби» записи.
      if (appointment.calendarEventId) {
        syncDeleteEvent(appointment.calendarEventId);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, tr('appt.cancel.confirmBtn'), true);
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
    success(
      tr('appt.complete.doneTitle'),
      tr('appt.rebook.bookedFor', { date: formatDate(toDateKey(newDate)), time: appointment.startTime }),
      () => router.back(),
    );
  };

  const handleReschedule = () => {
    if (!rescheduleTime) return;
    if (isRescheduleSlotTaken(rescheduleTime)) {
      showError(tr('appt.time.takenError'));
      return;
    }
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
    toast.success(tr('appt.toast.rescheduled'));
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
          tr('appt.photos.permTitle'),
          tr('appt.photos.permBody'),
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
        // Копируем в постоянную папку — иначе после чистки кэша фото пропадут.
        const persisted = result.assets.map((a) => persistImageToAppDir(a.uri));
        const existing = appointment.photos ?? [];
        // Сразу показываем локальные (мгновенно), потом меняем на storage-path.
        updateAppointment(appointment.id, { photos: [...existing, ...persisted] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Заливаем в облако (минус №13). Best-effort: при ошибке/без аккаунта
        // оставляем локальный URI.
        const uploaded = await Promise.all(
          persisted.map((u) => uploadPhoto(u, `appointments/${appointment.id}`)),
        );
        if (uploaded.some(Boolean)) {
          const swapped = persisted.map((u, i) => uploaded[i] ?? u);
          updateAppointment(appointment.id, { photos: [...existing, ...swapped] });
        }
      }
    } catch (err) {
      showError(tr('appt.photos.openFailed'), err instanceof Error ? err.message : String(err));
    }
  };

  const handleSaveNotes = () => {
    updateAppointment(appointment.id, { notes: notes.trim() || undefined });
    setEditingNotes(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success(tr('appt.toast.noteSaved'));
  };

  const handleSaveDeposit = () => {
    const n = Number(depositInput.replace(',', '.'));
    const valid = Number.isFinite(n) && n > 0;
    updateAppointment(appointment.id, {
      deposit: valid ? n : undefined,
      // снимаем «внесён» если депозит обнулили
      depositPaid: valid ? appointment.depositPaid : false,
    });
    setEditingDeposit(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleDepositPaid = () => {
    updateAppointment(appointment.id, { depositPaid: !appointment.depositPaid });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        toast.success(tr('appt.toast.messageCopied'));
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
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('appt.detailTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <View style={{ alignItems: 'center', marginBottom: sp.lg }}>
          <Badge label={statusLabel} color={statusColor} />
        </View>

        {/* Info card */}
        <GlassCard elevated style={styles.infoCard}>
          <InfoRow icon={<User size={18} color={colors.primary} />} label={tr('appt.field.client')} value={client?.name ?? ''} />
          <InfoRow icon={<Scissors size={18} color={colors.primary} />} label={tr('appt.field.service')} value={service?.name ?? ''} />
          <InfoRow icon={<Clock size={18} color={colors.primary} />} label={tr('appt.field.time')} value={`${formatDate(appointment.date)}, ${formatTimeRange(appointment.startTime, appointment.endTime)}`} />
          <View style={styles.infoRow}>
            <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('appt.field.price')}</Text>
            <Text style={[typo.h3, { color: colors.primary }]}>{formatCurrency(appointment.price)}</Text>
          </View>
        </GlassCard>

        {/* === ПРЕДОПЛАТА / ДЕПОЗИТ === (минус №4: снижает no-show) */}
        <Animated.View entering={FadeInDown.delay(80)}>
          <View style={[styles.sectionHeader, { marginTop: sp.lg }]}>
            <Wallet size={18} color={colors.textSecondary} />
            <Text style={[typo.bodyBold, { color: colors.text, marginLeft: 8 }]}>{tr('appt.deposit.title')}</Text>
          </View>
          {editingDeposit ? (
            <GlassCard style={{ marginTop: sp.sm }}>
              <TextInput
                value={depositInput}
                onChangeText={setDepositInput}
                placeholder={tr('appt.deposit.amountPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                style={[typo.body, { color: colors.text }]}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button title={tr('common.save')} onPress={handleSaveDeposit} size="sm" style={{ flex: 1 }} />
                <Button
                  title={tr('common.cancel')}
                  onPress={() => { setEditingDeposit(false); setDepositInput(appointment.deposit ? String(appointment.deposit) : ''); }}
                  variant="ghost"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          ) : appointment.deposit ? (
            <GlassCard style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: sp.sm }}>
              <Pressable onPress={() => setEditingDeposit(true)} hitSlop={8} style={{ flex: 1 }}>
                <Text style={[typo.h3, { color: colors.text }]}>{formatCurrency(appointment.deposit)}</Text>
                <Text style={[typo.small, { color: colors.textTertiary }]}>{tr('appt.deposit.tapToEdit')}</Text>
              </Pressable>
              <Pressable
                onPress={toggleDepositPaid}
                accessibilityRole="button"
                accessibilityLabel={appointment.depositPaid ? tr('appt.deposit.paidA11y') : tr('appt.deposit.pendingA11y')}
              >
                <Badge
                  label={appointment.depositPaid ? tr('appt.deposit.paidBadge') : tr('appt.deposit.pending')}
                  color={appointment.depositPaid ? colors.success : colors.warning}
                />
              </Pressable>
            </GlassCard>
          ) : (
            <Pressable
              onPress={() => setEditingDeposit(true)}
              style={[styles.notesBox, { backgroundColor: colors.surfaceElevated, borderRadius: br.md, marginTop: sp.sm }]}
            >
              <Text style={[typo.body, { color: colors.textTertiary }]}>
                {tr('appt.deposit.addCta')}
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* === NOTES SECTION === */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.sectionHeader, { marginTop: sp.lg }]}>
            <StickyNote size={18} color={colors.textSecondary} />
            <Text style={[typo.bodyBold, { color: colors.text, marginLeft: 8 }]}>{tr('appt.notes.title')}</Text>
          </View>
          {editingNotes ? (
            <GlassCard style={{ marginTop: sp.sm }}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={tr('appt.notes.placeholder')}
                placeholderTextColor={colors.textTertiary}
                style={[typo.body, { color: colors.text, minHeight: 80, textAlignVertical: 'top' }]}
                multiline
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button title={tr('common.save')} onPress={handleSaveNotes} size="sm" style={{ flex: 1 }} />
                <Button title={tr('common.cancel')} onPress={() => { setEditingNotes(false); setNotes(appointment.notes ?? ''); }} variant="ghost" size="sm" style={{ flex: 1 }} />
              </View>
            </GlassCard>
          ) : (
            <Pressable onPress={() => setEditingNotes(true)} style={[styles.notesBox, { backgroundColor: colors.surfaceElevated, borderRadius: br.md, marginTop: sp.sm }]}>
              <Text style={[typo.body, { color: appointment.notes ? colors.text : colors.textTertiary }]}>
                {appointment.notes || tr('appt.notes.empty')}
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
                    accessibilityLabel={tr('appt.remind.a11y')}
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
                      {tr('appt.remind.cta')}
                    </Text>
                    <Text style={[typo.small, { color: colors.primary, opacity: 0.7 }]}>
                      WhatsApp · SMS
                    </Text>
                  </Pressable>
                ) : null}

                <View style={[styles.actions, { marginTop: sp.md }]}>
                  <Button title={tr('appt.action.complete')} onPress={handleComplete} variant="primary" size="lg" style={{ flex: 1 }} />
                  <Button title={tr('appt.action.reschedule')} onPress={() => setShowReschedule(true)} variant="secondary" size="lg" style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              /* Reschedule picker */
              <GlassCard elevated style={{ marginTop: sp.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MoveRight size={18} color={colors.primary} />
                  <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('appt.reschedule.heading')}</Text>
                </View>
                {/* Date picker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                  {reschedDays.map((d) => {
                    const key = toDateKey(d);
                    const selected = toDateKey(rescheduleDate) === key;
                    return (
                      <Pressable key={key} onPress={() => { setRescheduleDate(d); setRescheduleTime(null); }}
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
                    const taken = isRescheduleSlotTaken(t);
                    return (
                      <Pressable key={t} disabled={taken} onPress={() => setRescheduleTime(t)}
                        accessibilityState={{ selected, disabled: taken }}
                        style={[styles.timeSlot, { backgroundColor: selected ? colors.primary : colors.surfaceElevated, borderRadius: br.sm, opacity: taken ? 0.35 : 1 }]}>
                        <Text style={[typo.caption, { color: selected ? colors.white : taken ? colors.textTertiary : colors.text }]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <Button title={tr('appt.action.reschedule')} onPress={handleReschedule} disabled={!rescheduleTime} size="md" style={{ flex: 1 }} />
                  <Button title={tr('common.cancel')} onPress={() => setShowReschedule(false)} variant="ghost" size="md" style={{ flex: 1 }} />
                </View>
              </GlassCard>
            )}

            <Button title={tr('appt.action.cancelAppt')} onPress={handleCancel} variant="danger" size="md" style={{ marginTop: 12, alignSelf: 'stretch' }} fullWidth />
          </Animated.View>
        )}

        {/* === COMPLETED: REBOOK === */}
        {appointment.status === 'completed' && (
          <Animated.View entering={FadeInDown.delay(200)} style={{ marginTop: sp.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CalendarPlus size={18} color={colors.primary} />
              <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('appt.rebook.title')}</Text>
            </View>
            <View style={styles.rebookGrid}>
              {REBOOK_OPTIONS.map((opt) => (
                <Pressable key={opt.weeks} onPress={() => handleRebook(opt.weeks)}
                  style={[styles.rebookChip, { backgroundColor: colors.primarySoft, borderRadius: br.md }]}>
                  <Text style={[typo.bodyBold, { color: colors.primary }]}>{tr(opt.labelKey)}</Text>
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
                <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('appt.photos.title')}</Text>
              </View>
              <Pressable onPress={handleAddPhoto} style={{ padding: 4 }}>
                <Text style={[typo.caption, { color: colors.primary }]}>{tr('appt.photos.add')}</Text>
              </Pressable>
            </View>
            {(appointment.photos?.length ?? 0) > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {appointment.photos!.map((uri, i) => (
                  // CloudImage резолвит и локальные URI, и облачные storage-path
                  // (с дисковым кэшем expo-image внутри).
                  <CloudImage
                    key={uri}
                    uri={uri}
                    accessibilityLabel={tr('appt.photos.itemA11y', { n: i + 1 })}
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
                  {tr('appt.photos.empty')}
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
          toast.success(tr('appt.toast.messageCopied'));
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
  const tr = useT();
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={remStyles.backdrop}>
        <RNPressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={tr('appt.reminder.close')} />
        <View style={[
          remStyles.sheet,
          { backgroundColor: colors.background, borderTopLeftRadius: br.lg, borderTopRightRadius: br.lg },
        ]}>
          <View style={remStyles.handleWrap}>
            <View style={[remStyles.handle, { backgroundColor: colors.border }]} />
          </View>
          <View style={{ paddingHorizontal: sp.lg, paddingBottom: sp.md }}>
            <Text style={[typo.h3, { color: colors.text }]} numberOfLines={1}>
              {tr('appt.reminder.title', { name: clientName.split(' ')[0] })}
            </Text>
            <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {tr('appt.reminder.subtitle')}
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
            <RemActionBtn label={tr('appt.reminder.copy')} bg={colors.primarySoft} iconColor={colors.primary}
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
