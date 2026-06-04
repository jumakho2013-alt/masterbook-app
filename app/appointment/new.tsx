import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { X, ArrowLeft, Scissors, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
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
import {
  toDateKey,
  formatDate,
  formatDateFull,
  getDayOfWeekShort,
  getMonthGrid,
  getMonthName,
  getWeekdayShortLabels,
} from '@/src/utils/date';
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
import { useT } from '@/src/hooks/useT';
import type { Client, Service } from '@/src/types';

type Step = 'client' | 'service' | 'time' | 'confirm';

const STEPS: Step[] = ['client', 'service', 'time', 'confirm'];
// Заголовки шагов резолвятся через i18n в render (appt.step.*).
const STEP_TITLE_KEYS: Record<Step, string> = {
  client: 'appt.step.client',
  service: 'appt.step.service',
  time: 'appt.step.time',
  confirm: 'appt.step.confirm',
};

const DATE_RANGE_DAYS = 120;

export default function NewAppointmentScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();

  // clientId-параметр: запись запущена из карточки клиента («Записать ещё»).
  // Предвыбираем клиента и стартуем сразу с шага услуги.
  const { clientId: preClientId } = useLocalSearchParams<{ clientId?: string }>();
  const preClient = preClientId
    ? useClientStore.getState().clients.find((c) => c.id === preClientId) ?? null
    : null;

  const [step, setStep] = useState<Step>(preClient ? 'service' : 'client');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(preClient);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // Месячный пикер — для дальних дат (фидбэк: «через год/полгода»). Полоса
  // на 120 дней остаётся для быстрого выбора ближайших; календарь — для дали.
  const [monthPickerMode, setMonthPickerMode] = useState(false);
  const [monthCursor, setMonthCursor] = useState<Date>(() => new Date());
  // Длительность для этой конкретной записи. Override на confirm-шаге —
  // новый клиент часто требует +30 мин, постоянный может уложиться меньше.
  // null = используем service.duration (дефолт).
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number | null>(null);
  // Своё время (фидбэк: «время как будто навязываем»). Мастер может выбрать
  // ЛЮБОЙ час/минуту — даже вне рабочих часов и не кратно 30 мин.
  const [customTimeMode, setCustomTimeMode] = useState(false);
  const [customHour, setCustomHour] = useState<number | null>(null);
  const [customMinute, setCustomMinute] = useState<number>(0);

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
  const todayKey = toDateKey(new Date());
  const isToday = selectedDateKey === todayKey;
  // Нельзя листать месяцы в прошлое (записей в прошлом не делаем).
  const now = new Date();
  const atCurrentMonth =
    monthCursor.getFullYear() === now.getFullYear() &&
    monthCursor.getMonth() === now.getMonth();

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

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const openCustomTime = () => {
    Haptics.selectionAsync();
    // Сидируем час из начала рабочего дня — дальше мастер крутит как хочет.
    if (customHour === null) {
      setCustomHour(Math.floor(timeToMinutes(workHours.start) / 60));
      setCustomMinute(0);
    }
    setCustomTimeMode(true);
  };

  const applyCustomTime = () => {
    if (customHour === null) return;
    const t = `${pad2(customHour)}:${pad2(customMinute)}`;
    // Прошлое блокируем (нельзя записать в прошедшее сегодня), пересечение —
    // тоже (защита от двойной записи). В остальном — любое время разрешено.
    if (isSlotPast(t)) { showError(tr('appt.time.pastError')); return; }
    // Модель слотов не умеет пересекать полночь (minutesToTime заворачивает по
    // mod 1440, и Zod-refine endTime>startTime потом упал бы с невнятной
    // ошибкой). Ловим заранее с понятным текстом. Проверяем ДО isSlotTaken —
    // иначе addMinutes даст завёрнутый slotEnd и overlap посчитается криво.
    const dur = customDurationMinutes ?? selectedService?.duration ?? 30;
    // >= 1440: конец ровно в 00:00 тоже невалиден — endTime станет "00:00",
    // а Zod-refine требует endTime > startTime (строкой "00:00" — минимум).
    if (timeToMinutes(t) + dur >= 24 * 60) { showError(tr('appt.time.crossMidnight')); return; }
    if (isSlotTaken(t)) { showError(tr('appt.time.takenError')); return; }
    Haptics.selectionAsync();
    setSelectedTime(t);
    setCustomTimeMode(false);
    next();
  };

  const openMonthPicker = () => {
    Haptics.selectionAsync();
    setMonthCursor(selectedDate);
    setMonthPickerMode((m) => !m);
  };

  const shiftMonth = (delta: number) => {
    Haptics.selectionAsync();
    const n = new Date(monthCursor);
    n.setDate(1); // setDate(1) до setMonth — иначе 31 янв + 1 мес перескочит март
    n.setMonth(n.getMonth() + delta);
    setMonthCursor(n);
  };

  const pickMonthDay = (day: Date) => {
    if (toDateKey(day) < todayKey) return; // прошлое нельзя
    Haptics.selectionAsync();
    setSelectedDate(day);
    setSelectedTime(null);
    setMonthPickerMode(false);
  };

  const confirm = async () => {
    if (!selectedClient) { showError(tr('appt.step.client')); return; }
    if (!selectedService) { showError(tr('appt.step.service')); return; }
    if (!selectedTime) { showError(tr('appt.validation.pickTime')); return; }

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
      showError(parsed.error.errors[0]?.message ?? tr('appt.validation.invalidData'));
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
          accessibilityLabel={stepIndex > 0 ? tr('appt.nav.back') : tr('appt.nav.close')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr(STEP_TITLE_KEYS[step])}</Text>
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
            <SearchBar value={search} onChangeText={setSearch} placeholder={tr('appt.client.searchPlaceholder')} />
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
                {tr('appt.client.recent')}
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
                title={search ? tr('appt.client.emptySearchTitle') : tr('appt.client.emptyTitle')}
                subtitle={search ? tr('appt.client.emptySearchSubtitle') : tr('appt.client.emptySubtitle')}
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
                title={tr('appt.service.emptyTitle')}
                subtitle={tr('appt.service.emptySubtitle')}
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
          {/* Шапка: выбранная дата (полная) + кнопка календаря для дальних дат */}
          <View style={styles.dateHeader}>
            <Text style={[typo.bodyBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {formatDateFull(selectedDate)}
            </Text>
            <TouchableOpacity
              onPress={openMonthPicker}
              accessibilityRole="button"
              accessibilityLabel={tr('appt.time.pickDate')}
              accessibilityState={{ selected: monthPickerMode }}
              hitSlop={8}
              style={[
                styles.calBtn,
                {
                  backgroundColor: monthPickerMode ? colors.primary : colors.surfaceElevated,
                  borderRadius: br.sm,
                },
              ]}
            >
              <CalendarDays size={20} color={monthPickerMode ? colors.white : colors.primary} />
            </TouchableOpacity>
          </View>

          {monthPickerMode ? (
            /* Месячный календарь — прыжок на любой месяц вперёд (год/полгода) */
            <View style={styles.monthPicker}>
              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={() => shiftMonth(-1)}
                  disabled={atCurrentMonth}
                  accessibilityRole="button"
                  accessibilityLabel={tr('common.back')}
                  hitSlop={8}
                  style={{ opacity: atCurrentMonth ? 0.3 : 1, padding: 4 }}
                >
                  <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[typo.bodyBold, { color: colors.text, textTransform: 'capitalize' }]}>
                  {getMonthName(monthCursor)} {monthCursor.getFullYear()}
                </Text>
                <TouchableOpacity
                  onPress={() => shiftMonth(1)}
                  accessibilityRole="button"
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdayRow}>
                {getWeekdayShortLabels().map((label, i) => (
                  <Text
                    key={i}
                    style={[typo.small, styles.weekdayLabel, { color: colors.textTertiary }]}
                  >
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.monthGridWrap}>
                {getMonthGrid(monthCursor).map((day, i) => {
                  if (!day) return <View key={`e${i}`} style={styles.monthCell} />;
                  const dKey = toDateKey(day);
                  const isPast = dKey < todayKey;
                  const selected = dKey === selectedDateKey;
                  const off = isDayOff(day);
                  return (
                    <View key={dKey} style={styles.monthCell}>
                      <TouchableOpacity
                        disabled={isPast}
                        onPress={() => pickMonthDay(day)}
                        accessibilityRole="button"
                        accessibilityLabel={formatDate(day)}
                        accessibilityState={{ selected, disabled: isPast }}
                        style={[
                          styles.monthDayBtn,
                          {
                            backgroundColor: selected ? colors.primary : 'transparent',
                            opacity: isPast ? 0.25 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typo.body,
                            {
                              color: selected
                                ? colors.white
                                : off
                                  ? colors.textTertiary
                                  : colors.text,
                            },
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            /* Date strip */
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
                    // Выходной день тоже можно выбрать (мастер сам решает —
                    // вдруг разовый приём в воскресенье). Просто визуально тусклее.
                    Haptics.selectionAsync();
                    setSelectedDate(d);
                    setSelectedTime(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={formatDate(d)}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : off
                          ? 'transparent'
                          : colors.surfaceElevated,
                      borderRadius: br.md,
                      opacity: off && !active ? 0.5 : 1,
                      borderColor: off && !active ? colors.border : 'transparent',
                      borderWidth: off && !active ? 1 : 0,
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
                    {getDayOfWeekShort(d)}
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
          )}

          {/* Time slots */}
          <ScrollView contentContainerStyle={styles.timeScroll}>
            <View style={styles.timeGrid}>
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
                    accessibilityLabel={`${t}${taken ? tr('appt.time.takenSuffix') : past ? tr('appt.time.pastSuffix') : ''}`}
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

              {/* «Другое время» — любое время вне сетки/рабочих часов */}
              {(() => {
                const customActive = !!selectedTime && !timeSlots.includes(selectedTime);
                const on = customTimeMode || customActive;
                return (
                  <TouchableOpacity
                    onPress={openCustomTime}
                    accessibilityRole="button"
                    accessibilityLabel={tr('appt.time.custom')}
                    accessibilityState={{ selected: on }}
                    style={[
                      styles.timeSlot,
                      {
                        backgroundColor: on ? colors.primary : colors.surface,
                        borderColor: on ? colors.primary : colors.border,
                        borderStyle: 'dashed',
                        borderRadius: 12,
                      },
                    ]}
                  >
                    <Text style={[typo.body, { color: on ? colors.white : colors.primary }]}>
                      {customActive ? selectedTime : tr('appt.time.custom')}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>

            {/* Инлайн-пикер: часы + минуты, любое значение */}
            {customTimeMode && (
              <GlassCard style={styles.customCard}>
                <Text style={[typo.caption, { color: colors.textSecondary }]}>
                  {tr('appt.time.customHint')}
                </Text>

                <Text style={[typo.small, { color: colors.textTertiary, marginTop: sp.sm }]}>
                  {tr('appt.time.customHours')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pickerRow}
                >
                  {Array.from({ length: 24 }, (_, h) => h).map((h) => {
                    const active = customHour === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCustomHour(h);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={[
                          styles.pickerChip,
                          {
                            backgroundColor: active ? colors.primary : colors.surfaceElevated,
                            borderRadius: br.sm,
                          },
                        ]}
                      >
                        <Text style={[typo.body, { color: active ? colors.white : colors.text }]}>
                          {pad2(h)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[typo.small, { color: colors.textTertiary, marginTop: sp.sm }]}>
                  {tr('appt.time.customMinutes')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pickerRow}
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
                    const active = customMinute === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCustomMinute(m);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={[
                          styles.pickerChip,
                          {
                            backgroundColor: active ? colors.primary : colors.surfaceElevated,
                            borderRadius: br.sm,
                          },
                        ]}
                      >
                        <Text style={[typo.body, { color: active ? colors.white : colors.text }]}>
                          {pad2(m)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Button
                  title={
                    customHour !== null
                      ? `${tr('common.done')} · ${pad2(customHour)}:${pad2(customMinute)}`
                      : tr('common.done')
                  }
                  onPress={applyCustomTime}
                  disabled={customHour === null}
                  style={{ marginTop: sp.md }}
                />
              </GlassCard>
            )}
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
              <Row label={tr('appt.field.client')} value={selectedClient?.name ?? ''} />
              <Row label={tr('appt.field.service')} value={selectedService?.name ?? ''} />
              <Row label={tr('appt.field.date')} value={formatDate(selectedDate)} />
              <Row
                label={tr('appt.field.time')}
                value={selectedTime ? `${selectedTime} — ${endTime}` : ''}
              />

              {/* Длительность — редактируемая. Шаг 15 мин. Новый клиент?
                  +30 мин одним тапом. Постоянный? Можно убавить. */}
              <View style={styles.durationRow}>
                <Text style={[typo.body, { color: colors.textSecondary }]}>{tr('appt.confirm.duration')}</Text>
                <View style={styles.durationControls}>
                  <Pressable
                    onPress={decrease}
                    accessibilityRole="button"
                    accessibilityLabel={tr('appt.confirm.durationDecrease')}
                    hitSlop={8}
                    style={[styles.durationBtn, { backgroundColor: colors.surfaceElevated, borderRadius: br.sm }]}
                  >
                    <Text style={[typo.bodyBold, { color: colors.text }]}>−</Text>
                  </Pressable>
                  <Text style={[typo.bodyBold, { color: colors.text, minWidth: 70, textAlign: 'center' }]}>
                    {tr('appt.confirm.minutes', { n: effectiveDuration })}
                  </Text>
                  <Pressable
                    onPress={increase}
                    accessibilityRole="button"
                    accessibilityLabel={tr('appt.confirm.durationIncrease')}
                    hitSlop={8}
                    style={[styles.durationBtn, { backgroundColor: colors.surfaceElevated, borderRadius: br.sm }]}
                  >
                    <Text style={[typo.bodyBold, { color: colors.text }]}>+</Text>
                  </Pressable>
                </View>
              </View>

              <Row label={tr('appt.field.price')} value={formatCurrency(selectedService?.price ?? 0)} />
            </GlassCard>

            <Button
              title={tr('appt.confirm.book')}
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
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  calBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPicker: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: 'center' },
  monthGridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  monthDayBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
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
  timeScroll: {
    paddingBottom: 24,
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
  customCard: {
    marginHorizontal: 16,
    marginTop: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingRight: 8,
  },
  pickerChip: {
    minWidth: 46,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
