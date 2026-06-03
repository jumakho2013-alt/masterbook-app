import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { X, ArrowLeft, Scissors } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { Button, IconButton, SearchBar, GlassCard, CustomAlert, EmptyState } from '@/src/components/ui';
import { ClientRow } from '@/src/components/ClientRow';
import { ServiceChip } from '@/src/components/ServiceChip';
import { useAlert } from '@/src/hooks/useAlert';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { toDateKey, formatDate } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';
import {
  addMinutes,
  generateTimeSlots,
  nowMinutesOfDay,
  timeRangesOverlap,
  timeToMinutes,
} from '@/src/utils/time';
import { scheduleAppointmentReminder } from '@/src/lib/notifications';
import { appointmentSchema } from '@/src/lib/validation';
import { syncCreateEvent } from '@/src/lib/calendarSync';
import type { Client, Service } from '@/src/types';

type Step = 'client' | 'service' | 'time' | 'confirm';

const STEPS: Step[] = ['client', 'service', 'time', 'confirm'];
const STEP_TITLES: Record<Step, string> = {
  client: 'Выберите клиента',
  service: 'Выберите услугу',
  time: 'Дата и время',
  confirm: 'Подтверждение',
};

const DATE_RANGE_DAYS = 30;

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();

  const [step, setStep] = useState<Step>('client');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // Длительность для этой конкретной записи. Override на confirm-шаге —
  // новый клиент часто требует +30 мин, постоянный может уложиться меньше.
  // null = используем service.duration (дефолт).
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number | null>(null);

  const searchClients = useClientStore((s) => s.searchClients);
  const allClients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const updateAppointment = useAppointmentStore((s) => s.updateAppointment);
  const allAppointments = useAppointmentStore((s) => s.appointments);

  // Top-5 недавних клиентов по последнему visit'у. Показываем горизонтальной
  // полоской над списком — главный use-case: записать постоянного клиента.
  const recentClients = useMemo(() => {
    if (search.trim().length > 0) return []; // во время поиска скрываем
    const lastVisit: Record<string, string> = {};
    for (const a of allAppointments) {
      if (a.status === 'completed' || a.status === 'scheduled') {
        if (!lastVisit[a.clientId] || a.date > lastVisit[a.clientId]) {
          lastVisit[a.clientId] = a.date;
        }
      }
    }
    return allClients
      .filter((c) => lastVisit[c.id])
      .sort((a, b) => lastVisit[b.id].localeCompare(lastVisit[a.id]))
      .slice(0, 5);
  }, [allClients, allAppointments, search]);
  const workHours = useSettingsStore((s) => s.workHours);
  const workDays = useSettingsStore((s) => s.workDays);
  const breakTime = useSettingsStore((s) => s.breakTime);
  const bufferMinutes = useSettingsStore((s) => s.bufferMinutes);

  const { alertConfig, error: showError } = useAlert();

  const stepIndex = STEPS.indexOf(step);
  const selectedDateKey = toDateKey(selectedDate);
  const isToday = selectedDateKey === toDateKey(new Date());

  // Date strip: next N days
  const dateStrip = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DATE_RANGE_DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const rawTimeSlots = useMemo(
    () => generateTimeSlots(workHours.start, workHours.end, 30),
    [workHours.start, workHours.end],
  );

  const timeSlots = useMemo(
    () =>
      rawTimeSlots.filter((t) => {
        if (!breakTime.enabled) return true;
        const mins = timeToMinutes(t);
        const breakStart = timeToMinutes(breakTime.start);
        const breakEnd = timeToMinutes(breakTime.end);
        return mins < breakStart || mins >= breakEnd;
      }),
    [rawTimeSlots, breakTime],
  );

  const existingAppts = useMemo(
    () => allAppointments.filter((a) => a.date === selectedDateKey && a.status === 'scheduled'),
    [allAppointments, selectedDateKey],
  );

  const nowMin = nowMinutesOfDay();

  const isSlotTaken = (time: string): boolean => {
    const duration = selectedService?.duration ?? 30;
    const slotEnd = addMinutes(time, duration);
    return existingAppts.some((a) =>
      // Буфер расширяет занятые интервалы в обе стороны — между записями
      // остаётся «воздух», чтобы мастер успел перехватить клиента.
      timeRangesOverlap(
        time,
        slotEnd,
        addMinutes(a.startTime, -bufferMinutes),
        addMinutes(a.endTime, bufferMinutes),
      ),
    );
  };

  const isSlotPast = (time: string): boolean =>
    isToday && timeToMinutes(time) <= nowMin;

  const isDayOff = (d: Date) => !workDays.includes(d.getDay());

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) {
      Haptics.selectionAsync();
      setStep(STEPS[i + 1]);
    }
  };

  const back = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
    else router.back();
  };

  const confirm = async () => {
    if (!selectedClient) { showError('Выберите клиента'); return; }
    if (!selectedService) { showError('Выберите услугу'); return; }
    if (!selectedTime) { showError('Выберите время'); return; }

    const effectiveDuration = customDurationMinutes ?? selectedService.duration;
    const endTime = addMinutes(selectedTime, effectiveDuration);

    // Final Zod validation
    const parsed = appointmentSchema.safeParse({
      clientId: selectedClient.id,
      serviceId: selectedService.id,
      date: selectedDateKey,
      startTime: selectedTime,
      endTime,
      price: selectedService.price,
    });
    if (!parsed.success) {
      showError(parsed.error.errors[0]?.message ?? 'Некорректные данные');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const appt = addAppointment({
      clientId: selectedClient.id,
      serviceId: selectedService.id,
      date: selectedDateKey,
      startTime: selectedTime,
      endTime,
      status: 'scheduled',
      price: selectedService.price,
    });

    // Auto-schedule reminder 60 min before the appointment (fire-and-forget).
    scheduleAppointmentReminder(
      appt.id,
      selectedClient.name,
      selectedService.name,
      selectedDateKey,
      selectedTime,
      60,
    )
      .then((notifId) => {
        if (notifId) updateAppointment(appt.id, { reminderNotificationId: notifId });
      })
      .catch(() => {
        // User might have declined notifications — don't fail the booking.
      });

    // Sync в системный календарь (если включено в настройках, no-op иначе).
    syncCreateEvent(appt, selectedClient.name, selectedService.name)
      .then((eventId) => {
        if (eventId) updateAppointment(appt.id, { calendarEventId: eventId });
      })
      .catch(() => {});

    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={styles.topBar}>
        <IconButton
          icon={stepIndex > 0 ? <ArrowLeft size={22} color={colors.text} /> : <X size={22} color={colors.text} />}
          onPress={back}
          variant="ghost"
          accessibilityLabel={stepIndex > 0 ? 'Назад' : 'Закрыть'}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{STEP_TITLES[step]}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              { backgroundColor: i <= stepIndex ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>

      {/* Step content */}
      {step === 'client' && (
        <Animated.View entering={FadeInRight.duration(300)} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Имя или телефон..." />
          </View>

          {/* Recent clients — горизонтальная полоска. Скрывается при поиске
              (фильтрованный список — главный фокус). */}
          {recentClients.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text
                style={[
                  typo.small,
                  {
                    color: colors.textTertiary,
                    paddingHorizontal: 20,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  },
                ]}
              >
                Недавние
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              >
                {recentClients.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedClient(c);
                      next();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                    style={[
                      styles.recentChip,
                      { backgroundColor: colors.surfaceElevated, borderRadius: br.md },
                    ]}
                  >
                    <Text style={[typo.caption, { color: colors.text, fontFamily: typo.bodyBold.fontFamily }]} numberOfLines={1}>
                      {c.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <FlatList
            data={searchClients(search)}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <EmptyState
                icon={<Scissors size={48} color={colors.textTertiary} />}
                title={search ? 'Никого не нашли' : 'Нет клиентов'}
                subtitle={search ? 'Попробуйте другой запрос' : 'Сначала добавьте клиента в разделе «Клиенты»'}
              />
            }
            renderItem={({ item }) => (
              <ClientRow
                client={item}
                onPress={() => {
                  setSelectedClient(item);
                  next();
                }}
              />
            )}
          />
        </Animated.View>
      )}

      {step === 'service' && (
        <Animated.View entering={FadeInRight.duration(300)} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {services.length === 0 && (
              <EmptyState
                icon={<Scissors size={48} color={colors.textTertiary} />}
                title="Нет услуг"
                subtitle="Добавьте услуги в Профиль → Мои услуги"
              />
            )}
            {services.map((s) => (
              <ServiceChip
                key={s.id}
                service={s}
                selected={selectedService?.id === s.id}
                onPress={() => {
                  setSelectedService(s);
                  next();
                }}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {step === 'time' && (
        <Animated.View entering={FadeInRight.duration(300)} style={{ flex: 1 }}>
          {/* Date strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {dateStrip.map((d) => {
              const key = toDateKey(d);
              const active = key === selectedDateKey;
              const off = isDayOff(d);
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    if (!off) {
                      Haptics.selectionAsync();
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }
                  }}
                  disabled={off}
                  accessibilityRole="button"
                  accessibilityLabel={formatDate(d)}
                  accessibilityState={{ selected: active, disabled: off }}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : off
                          ? 'transparent'
                          : colors.surfaceElevated,
                      borderRadius: br.md,
                      opacity: off ? 0.35 : 1,
                      borderColor: off ? colors.border : 'transparent',
                      borderWidth: off ? 1 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typo.small,
                      {
                        color: active ? colors.white : colors.textSecondary,
                        textTransform: 'uppercase',
                      },
                    ]}
                  >
                    {d.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2)}
                  </Text>
                  <Text
                    style={[
                      typo.h3,
                      { color: active ? colors.white : colors.text, marginTop: 2 },
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Time slots */}
          <ScrollView contentContainerStyle={styles.timeGrid}>
            {timeSlots.map((t) => {
              const taken = isSlotTaken(t);
              const past = isSlotPast(t);
              const disabled = taken || past;
              const active = selectedTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    if (!disabled) {
                      Haptics.selectionAsync();
                      setSelectedTime(t);
                      next();
                    }
                  }}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`${t}${taken ? ', занято' : past ? ', прошло' : ''}`}
                  accessibilityState={{ selected: active, disabled }}
                  style={[
                    styles.timeSlot,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : disabled
                          ? colors.surfaceElevated
                          : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: 12,
                      opacity: disabled ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typo.body,
                      {
                        color: disabled
                          ? colors.textTertiary
                          : active
                            ? colors.white
                            : colors.text,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {step === 'confirm' && (() => {
        const effectiveDuration = customDurationMinutes ?? selectedService?.duration ?? 0;
        const endTime = selectedTime ? addMinutes(selectedTime, effectiveDuration) : '';
        const decrease = () => {
          const next = Math.max(15, effectiveDuration - 15);
          setCustomDurationMinutes(next);
          Haptics.selectionAsync();
        };
        const increase = () => {
          const next = Math.min(480, effectiveDuration + 15);
          setCustomDurationMinutes(next);
          Haptics.selectionAsync();
        };
        return (
          <Animated.View entering={FadeInRight.duration(300)} style={styles.confirmWrap}>
            <GlassCard style={styles.confirmCard}>
              <Row label="Клиент" value={selectedClient?.name ?? ''} />
              <Row label="Услуга" value={selectedService?.name ?? ''} />
              <Row label="Дата" value={formatDate(selectedDate)} />
              <Row
                label="Время"
                value={selectedTime ? `${selectedTime} — ${endTime}` : ''}
              />

              {/* Длительность — редактируемая. Шаг 15 мин. Новый клиент?
                  +30 мин одним тапом. Постоянный? Можно убавить. */}
              <View style={styles.durationRow}>
                <Text style={[typo.body, { color: colors.textSecondary }]}>Длительность</Text>
                <View style={styles.durationControls}>
                  <Pressable
                    onPress={decrease}
                    accessibilityRole="button"
                    accessibilityLabel="Уменьшить длительность на 15 минут"
                    hitSlop={8}
                    style={[styles.durationBtn, { backgroundColor: colors.surfaceElevated, borderRadius: br.sm }]}
                  >
                    <Text style={[typo.bodyBold, { color: colors.text }]}>−</Text>
                  </Pressable>
                  <Text style={[typo.bodyBold, { color: colors.text, minWidth: 70, textAlign: 'center' }]}>
                    {effectiveDuration} мин
                  </Text>
                  <Pressable
                    onPress={increase}
                    accessibilityRole="button"
                    accessibilityLabel="Увеличить длительность на 15 минут"
                    hitSlop={8}
                    style={[styles.durationBtn, { backgroundColor: colors.surfaceElevated, borderRadius: br.sm }]}
                  >
                    <Text style={[typo.bodyBold, { color: colors.text }]}>+</Text>
                  </Pressable>
                </View>
              </View>

              <Row label="Стоимость" value={formatCurrency(selectedService?.price ?? 0)} />
            </GlassCard>

            <Button
              title="Записать"
              onPress={confirm}
              size="lg"
              style={{ marginTop: sp.lg }}
            />
          </Animated.View>
        );
      })()}
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors, typography: typo } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={[typo.body, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typo.bodyBold, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  dateStrip: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
  },
  dateChip: {
    width: 56,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  timeSlot: {
    minWidth: 84,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmWrap: {
    flex: 1,
    padding: 24,
  },
  confirmCard: {
    gap: 4,
  },
});
