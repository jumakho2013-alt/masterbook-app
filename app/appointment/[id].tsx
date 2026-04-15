import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft, Clock, User, Scissors, CalendarPlus,
  MoveRight, StickyNote, Check, X, CameraIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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
import type { ColorScheme } from '@/src/theme';

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

function generateTimeSlots(start: string, end: string, step: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  while (mins < endMins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    mins += step;
  }
  return slots;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

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

  const { alertConfig, success, confirm } = useAlert();
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
    success('Готово!', 'Запись завершена, доход записан', () => router.back());
  };

  const handleCancel = () => {
    confirm('Отменить запись?', 'Запись будет помечена как отменённая', () => { setStatus(appointment.id, 'cancelled'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }, 'Отменить', true);
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
    const newEnd = addMinutesToTime(rescheduleTime, duration);
    updateAppointment(appointment.id, {
      date: toDateKey(rescheduleDate),
      startTime: rescheduleTime,
      endTime: newEnd,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Запись перенесена');
    setShowReschedule(false);
  };

  const handleAddPhoto = async () => {
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
  };

  const handleSaveNotes = () => {
    updateAppointment(appointment.id, { notes: notes.trim() || undefined });
    setEditingNotes(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success('Заметка сохранена');
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
          <InfoRow icon={<User size={18} color={colors.primary} />} label="Клиент" value={client?.name ?? ''} colors={colors} typo={typo} />
          <InfoRow icon={<Scissors size={18} color={colors.primary} />} label="Услуга" value={service?.name ?? ''} colors={colors} typo={typo} />
          <InfoRow icon={<Clock size={18} color={colors.primary} />} label="Время" value={`${formatDate(appointment.date)}, ${formatTimeRange(appointment.startTime, appointment.endTime)}`} colors={colors} typo={typo} />
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
              <View style={[styles.actions, { marginTop: sp.lg }]}>
                <Button title="Завершить" onPress={handleComplete} variant="primary" size="lg" style={{ flex: 1 }} />
                <Button title="Перенести" onPress={() => setShowReschedule(true)} variant="secondary" size="lg" style={{ flex: 1 }} />
              </View>
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
                    key={i}
                    source={{ uri }}
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
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, colors, typo }: { icon: React.ReactNode; label: string; value: string; colors: ColorScheme; typo: Record<string, any> }) {
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
  dateChip: { paddingHorizontal: 14, paddingVertical: 8 },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeSlot: { paddingHorizontal: 14, paddingVertical: 10, minWidth: 60, alignItems: 'center' },
  rebookGrid: { flexDirection: 'row', gap: 10 },
  rebookChip: { flex: 1, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  photo: { width: 120, height: 120, marginRight: 10, borderWidth: 0.5 },
  addPhotoBox: { alignItems: 'center', justifyContent: 'center', height: 120, borderWidth: 1, borderStyle: 'dashed' },
});
