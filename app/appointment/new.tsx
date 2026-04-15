import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { X, Check, ArrowLeft, Scissors } from 'lucide-react-native';
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
import { toDateKey } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';
import type { Client, Service } from '@/src/types';

type Step = 'client' | 'service' | 'time' | 'confirm';

const STEPS: Step[] = ['client', 'service', 'time', 'confirm'];
const STEP_TITLES: Record<Step, string> = {
  client: 'Выберите клиента',
  service: 'Выберите услугу',
  time: 'Дата и время',
  confirm: 'Подтверждение',
};

function generateTimeSlots(start: string, end: string, stepMin: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (current < endMin) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += stepMin;
  }
  return slots;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();

  const [step, setStep] = useState<Step>('client');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const searchClients = useClientStore((s) => s.searchClients);
  const services = useServiceStore((s) => s.services);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const workHours = useSettingsStore((s) => s.workHours);
  const breakTime = useSettingsStore((s) => s.breakTime);

  const { alertConfig, error: showError } = useAlert();

  const stepIndex = STEPS.indexOf(step);
  const rawTimeSlots = generateTimeSlots(workHours.start, workHours.end, 30);

  // Filter out break time slots
  const timeSlots = rawTimeSlots.filter((t) => {
    if (!breakTime.enabled) return true;
    const mins = timeToMinutes(t);
    const breakStart = timeToMinutes(breakTime.start);
    const breakEnd = timeToMinutes(breakTime.end);
    return mins < breakStart || mins >= breakEnd;
  });

  // Overlap detection for selected date
  const existingAppts = allAppointments.filter(
    (a) => a.date === toDateKey(selectedDate) && a.status === 'scheduled',
  );
  const isSlotTaken = (time: string) => {
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + (selectedService?.duration ?? 30);
    return existingAppts.some((a) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return slotStart < aEnd && slotEnd > aStart;
    });
  };

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const appt = addAppointment({
      clientId: selectedClient.id,
      serviceId: selectedService.id,
      date: toDateKey(selectedDate),
      startTime: selectedTime,
      endTime: addMinutes(selectedTime, selectedService.duration),
      status: 'scheduled',
      price: selectedService.price,
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <IconButton
          icon={stepIndex > 0 ? <ArrowLeft size={22} color={colors.text} /> : <X size={22} color={colors.text} />}
          onPress={back}
          variant="ghost"
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
          <FlatList
            data={searchClients(search)}
            keyExtractor={(item) => item.id}
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
          <ScrollView contentContainerStyle={styles.timeGrid}>
            {timeSlots.map((t) => {
              const taken = isSlotTaken(t);
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    if (!taken) {
                      setSelectedTime(t);
                      next();
                    }
                  }}
                  disabled={taken}
                  style={[
                    styles.timeSlot,
                    {
                      backgroundColor: taken
                        ? colors.border
                        : selectedTime === t
                          ? colors.primary
                          : colors.surface,
                      borderColor: taken
                        ? colors.border
                        : selectedTime === t
                          ? colors.primary
                          : colors.border,
                      borderRadius: 10,
                      opacity: taken ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typo.body,
                      {
                        color: taken
                          ? colors.textTertiary
                          : selectedTime === t
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

      {step === 'confirm' && (
        <Animated.View entering={FadeInRight.duration(300)} style={styles.confirmWrap}>
          <GlassCard style={styles.confirmCard}>
            <Row label="Клиент" value={selectedClient?.name ?? ''} colors={colors} typo={typo} />
            <Row label="Услуга" value={selectedService?.name ?? ''} colors={colors} typo={typo} />
            <Row label="Дата" value={toDateKey(selectedDate)} colors={colors} typo={typo} />
            <Row
              label="Время"
              value={selectedTime ? `${selectedTime} — ${addMinutes(selectedTime, selectedService?.duration ?? 0)}` : ''}
              colors={colors}
              typo={typo}
            />
            <Row label="Стоимость" value={formatCurrency(selectedService?.price ?? 0)} colors={colors} typo={typo} />
          </GlassCard>

          <Button
            title="Записать"
            onPress={confirm}
            size="lg"
            style={{ marginTop: sp.lg }}
          />
        </Animated.View>
      )}
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

function Row({ label, value, colors, typo }: { label: string; value: string; colors: any; typo: any }) {
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  confirmWrap: {
    flex: 1,
    padding: 24,
  },
  confirmCard: {
    gap: 4,
  },
});
