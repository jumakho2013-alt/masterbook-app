import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Coffee, Timer } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { IconButton, GlassCard, Button, useToast } from '@/src/components/ui';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const BUFFER_OPTIONS = [0, 15, 30];

export default function WorkHoursScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();

  const workHours = useSettingsStore((s) => s.workHours);
  const workDays = useSettingsStore((s) => s.workDays);
  const breakTime = useSettingsStore((s) => s.breakTime);
  const bufferMinutes = useSettingsStore((s) => s.bufferMinutes);
  const setWorkHours = useSettingsStore((s) => s.setWorkHours);
  const setWorkDays = useSettingsStore((s) => s.setWorkDays);
  const setBreakTime = useSettingsStore((s) => s.setBreakTime);
  const setBufferMinutes = useSettingsStore((s) => s.setBufferMinutes);

  const [start, setStart] = useState(workHours.start);
  const [end, setEnd] = useState(workHours.end);
  const [days, setDays] = useState(workDays);
  const [brk, setBrk] = useState(breakTime);
  const [buffer, setBuffer] = useState(bufferMinutes);
  const toast = useToast();

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const save = () => {
    const startMins = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMins = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    if (endMins <= startMins) {
      toast.error('Конец рабочего дня должен быть позже начала');
      return;
    }
    setWorkHours(start, end);
    setWorkDays(days);
    setBreakTime(brk);
    setBufferMinutes(buffer);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Рабочее время сохранено');
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <Text style={[typo.h3, { color: colors.text }]}>Рабочее время</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Work hours */}
        <GlassCard elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={18} color={colors.primary} />
            <Text style={[typo.bodyBold, { color: colors.text }]}>Часы работы</Text>
          </View>

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typo.small, { color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' }]}>Начало</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {HALF_HOURS.filter((_, i) => i >= 12 && i <= 24).map((t) => (
                  <Pressable key={`s-${t}`} onPress={() => setStart(t)}
                    style={[styles.timeChip, { backgroundColor: start === t ? colors.primary : colors.surfaceElevated, borderRadius: br.sm }]}>
                    <Text style={[typo.caption, { color: start === t ? colors.white : colors.text }]}>{t}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={[styles.timeRow, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typo.small, { color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' }]}>Конец</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {HALF_HOURS.filter((_, i) => i >= 28 && i <= 44).map((t) => (
                  <Pressable key={`e-${t}`} onPress={() => setEnd(t)}
                    style={[styles.timeChip, { backgroundColor: end === t ? colors.primary : colors.surfaceElevated, borderRadius: br.sm }]}>
                    <Text style={[typo.caption, { color: end === t ? colors.white : colors.text }]}>{t}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </GlassCard>

        {/* Work days */}
        <GlassCard elevated style={{ marginTop: sp.md }}>
          <Text style={[typo.bodyBold, { color: colors.text, marginBottom: 16 }]}>Рабочие дни</Text>
          <View style={styles.daysRow}>
            {DAY_NAMES.map((name, i) => {
              const active = days.includes(i);
              return (
                <Pressable key={i} onPress={() => toggleDay(i)}
                  style={[styles.dayChip, {
                    backgroundColor: active ? colors.primary : colors.surfaceElevated,
                    borderRadius: br.sm,
                  }]}>
                  <Text style={[typo.bodyBold, { color: active ? colors.white : colors.textSecondary, fontSize: 14 }]}>{name}</Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* Break */}
        <GlassCard elevated style={{ marginTop: sp.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Coffee size={18} color={colors.warning} />
              <Text style={[typo.bodyBold, { color: colors.text }]}>Перерыв</Text>
            </View>
            <Switch
              value={brk.enabled}
              onValueChange={(v) => setBrk({ ...brk, enabled: v })}
              trackColor={{ true: colors.primary, false: colors.surfaceElevated }}
            />
          </View>
          {brk.enabled && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.breakTimeRow}>
                <Text style={[typo.caption, { color: colors.textSecondary }]}>С</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 8 }}>
                  {HALF_HOURS.filter((t) => t >= start && t < end).map((t) => (
                    <Pressable key={`bs-${t}`} onPress={() => setBrk({ ...brk, start: t })}
                      style={[styles.timeChip, { backgroundColor: brk.start === t ? colors.warning : colors.surfaceElevated, borderRadius: br.sm }]}>
                      <Text style={[typo.caption, { color: brk.start === t ? colors.white : colors.text }]}>{t}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={[styles.breakTimeRow, { marginTop: 8 }]}>
                <Text style={[typo.caption, { color: colors.textSecondary }]}>До</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 8 }}>
                  {HALF_HOURS.filter((t) => t > start && t <= end).map((t) => (
                    <Pressable key={`be-${t}`} onPress={() => setBrk({ ...brk, end: t })}
                      style={[styles.timeChip, { backgroundColor: brk.end === t ? colors.warning : colors.surfaceElevated, borderRadius: br.sm }]}>
                      <Text style={[typo.caption, { color: brk.end === t ? colors.white : colors.text }]}>{t}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Buffer */}
        <GlassCard elevated style={{ marginTop: sp.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Timer size={18} color={colors.accent} />
            <Text style={[typo.bodyBold, { color: colors.text }]}>Буфер между записями</Text>
          </View>
          <Text style={[typo.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
            Время на подготовку после каждой записи
          </Text>
          <View style={styles.bufferRow}>
            {BUFFER_OPTIONS.map((mins) => (
              <Pressable key={mins} onPress={() => setBuffer(mins)}
                style={[styles.bufferChip, {
                  backgroundColor: buffer === mins ? colors.primary : colors.surfaceElevated,
                  borderRadius: br.md,
                }]}>
                <Text style={[typo.bodyBold, { color: buffer === mins ? colors.white : colors.text }]}>
                  {mins === 0 ? 'Нет' : `${mins} мин`}
                </Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        <Button title="Сохранить" onPress={save} size="lg" fullWidth style={{ marginTop: sp.lg }} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 4 },
  content: { padding: 16 },
  timeRow: {},
  timeChip: { paddingHorizontal: 14, paddingVertical: 10, marginRight: 6 },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  breakTimeRow: { flexDirection: 'row', alignItems: 'center' },
  bufferRow: { flexDirection: 'row', gap: 10 },
  bufferChip: { flex: 1, alignItems: 'center', paddingVertical: 16 },
});
