import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { EmptyState } from '@/src/components/ui';
import { DayView } from '@/src/components/CalendarDayView';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, Clock } from 'lucide-react-native';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { useT } from '@/src/hooks/useT';
import { toDateKey, getDayOfWeekShort, getDayNumber, getMonthName, getMonthGrid, getWeekdayShortLabels, formatDateFull } from '@/src/utils/date';

type ViewMode = 'day' | 'week' | 'month';
const SERIF = 'CormorantGaramond_600SemiBold';


function getWeekDays(centerDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}


function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

function CalendarScreen() {
  const router = useRouter();
  const { colors, typography: typo, borderRadius: br, spacing: sp, isDark } = useTheme();
  const tr = useT();
  const onPrimary = isDark ? '#2A2030' : colors.white;
  const bottomOffset = useTabBarOffset(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);

  const weekDays = getWeekDays(selectedDate);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);

  // Count per day — нужно для визуальной плотности (1 / 2-3 / 4+ → разная
  // насыщенность точки в week-strip и фона ячейки в month-grid).
  const apptCountByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of allAppointments) {
      if (a.status === 'scheduled' || a.status === 'completed') {
        map[a.date] = (map[a.date] ?? 0) + 1;
      }
    }
    return map;
  }, [allAppointments]);

  const appointments = useMemo(
    () => allAppointments.filter((a) => a.date === selectedKey).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [allAppointments, selectedKey],
  );

  const monthGrid = useMemo(() => getMonthGrid(monthCursor), [monthCursor]);

  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getService = (id: string) => services.find((s) => s.id === id);

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setMonthCursor(now);
  };

  const prevMonth = () => {
    const next = new Date(monthCursor);
    next.setMonth(next.getMonth() - 1);
    setMonthCursor(next);
  };

  const nextMonth = () => {
    const next = new Date(monthCursor);
    next.setMonth(next.getMonth() + 1);
    setMonthCursor(next);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const isToday = (d: Date) => toDateKey(d) === todayKey;
  const isSelectedDay = (d: Date) => toDateKey(d) === selectedKey;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typo.display, { color: colors.text }]}>{tr('calendar.title')}</Text>
          <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' }]}>
            {getMonthName(viewMode === 'month' ? monthCursor : selectedDate)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={goToToday}
            accessibilityRole="button"
            accessibilityLabel={tr('calendar.goToTodayA11y')}
            hitSlop={{ top: 8, bottom: 8 }}
            style={[
              styles.todayBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: br.sm,
              },
            ]}
          >
            <Text style={[typo.caption, { color: colors.white, fontFamily: typo.bodyBold.fontFamily }]}>
              {tr('calendar.today')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              // Цикл: day → week → month → day
              setViewMode((m) => (m === 'day' ? 'week' : m === 'week' ? 'month' : 'day'));
            }}
            accessibilityRole="button"
            accessibilityLabel={tr('calendar.modeA11y', { mode: viewMode === 'day' ? tr('calendar.modeDay') : viewMode === 'week' ? tr('calendar.modeWeek') : tr('calendar.modeMonth') })}
            style={[styles.modeBtn, { backgroundColor: colors.surfaceElevated, borderRadius: br.sm }]}
          >
            {viewMode === 'day' ? (
              <Clock size={16} color={colors.textSecondary} />
            ) : viewMode === 'week' ? (
              <LayoutGrid size={16} color={colors.textSecondary} />
            ) : (
              <CalendarDays size={16} color={colors.textSecondary} />
            )}
          </Pressable>
        </View>
      </View>

      {viewMode === 'day' ? (
        <DayView
          appointments={appointments}
          selectedDate={selectedDate}
          getClient={getClient}
          getService={getService}
          onPressEmpty={(hour) => {
            // тап на пустой час — создать новую запись (тип «modal»)
            router.push({
              pathname: '/appointment/new',
              params: { startHour: String(hour) },
            });
          }}
          onPressAppt={(aptId) => router.push(`/appointment/${aptId}`)}
          bottomOffset={bottomOffset}
        />
      ) : viewMode === 'week' ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
            {weekDays.map((day) => {
              const key = toDateKey(day);
              const selected = isSelectedDay(day);
              const today = isToday(day);
              const count = apptCountByDay[key] ?? 0;
              const dotCount = count >= 4 ? 3 : count;
              const dotColor = selected ? colors.white : colors.primary;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedDate(day)}
                  activeOpacity={0.7}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: selected ? colors.primary : 'transparent',
                      borderRadius: br.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typo.small,
                      { color: selected ? colors.white : colors.textSecondary, textTransform: 'capitalize' },
                    ]}
                  >
                    {getDayOfWeekShort(day)}
                  </Text>
                  <Text
                    style={[
                      typo.h3,
                      { color: selected ? colors.white : today ? colors.primary : colors.text },
                    ]}
                  >
                    {getDayNumber(day)}
                  </Text>
                  {/* Multi-dot density: 0 = пусто, 1/2/3 = точно столько,
                      4+ = три точки (как «много»). Сразу видно busy days. */}
                  {dotCount > 0 && (
                    <View style={styles.dotRow}>
                      {Array.from({ length: dotCount }).map((_, i) => (
                        <View key={i} style={[styles.apptDot, { backgroundColor: dotColor }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} style={styles.monthView}>
          {/* Month nav */}
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} style={styles.navBtn}>
              <ChevronLeft size={22} color={colors.text} />
            </Pressable>
            <Text style={[typo.bodyBold, { color: colors.text, textTransform: 'capitalize', flex: 1, textAlign: 'center' }]}>
              {getMonthName(monthCursor)} {monthCursor.getFullYear()}
            </Text>
            <Pressable onPress={nextMonth} style={styles.navBtn}>
              <ChevronRight size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Calendar card (Atelier): серифные числа, плам-круг выбранного дня, точки */}
          <View style={[styles.calCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.weekdayRow}>
              {getWeekdayShortLabels().map((label, i) => (
                <Text key={i} style={[typo.label, styles.weekdayLabel, { color: colors.textTertiary }]}>{label}</Text>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {monthGrid.map((day, i) => {
                if (!day) return <View key={`empty-${i}`} style={styles.monthCell} />;
                const key = toDateKey(day);
                const selected = isSelectedDay(day);
                const today = isToday(day);
                const count = apptCountByDay[key] ?? 0;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setSelectedDate(day)}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.getDate()}${count > 0 ? `, ${count} ${plural(count, 'запись', 'записи', 'записей')}` : ''}`}
                    style={styles.monthCell}
                  >
                    <View style={[styles.dayCircle, selected && { backgroundColor: colors.primary }]}>
                      <Text style={{ fontFamily: SERIF, fontSize: 17, color: selected ? onPrimary : today ? colors.primary : colors.text }}>
                        {day.getDate()}
                      </Text>
                    </View>
                    <View style={styles.dayDotRow}>
                      {count > 0 && !selected && (
                        <View style={[styles.monthDot, { backgroundColor: count >= 4 ? colors.gold : colors.primary }]} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomOffset + 20 }}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          appointments.length > 0 ? (
            <Text style={{ fontFamily: SERIF, fontSize: 20, color: colors.text, textTransform: 'capitalize', marginBottom: 6 }}>
              {formatDateFull(selectedDate)}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={<CalendarIcon size={48} color={colors.textTertiary} />}
            title={tr('calendar.emptyTitle')}
            subtitle={tr('calendar.noAppointmentsThisDay')}
          />
        }
        renderItem={({ item, index }) => {
          const service = getService(item.serviceId);
          const client = getClient(item.clientId);
          const ac = item.status === 'completed' ? colors.success : index % 2 === 0 ? colors.primary : colors.gold;
          return (
            <Pressable onPress={() => router.push(`/appointment/${item.id}`)} style={styles.agendaRow}>
              <View style={[styles.agendaBar, { backgroundColor: ac }]} />
              <Text style={{ fontFamily: SERIF, fontSize: 19, color: colors.text, width: 52 }}>{item.startTime}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typo.bodyBold, { color: colors.text }]} numberOfLines={1}>{service?.name ?? tr('components.serviceFallback')}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>{client?.name ?? tr('components.clientFallback')}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  todayBtn: { paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  modeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  weekStrip: { paddingHorizontal: 16, gap: 6 },
  dayCell: { width: 46, height: 68, alignItems: 'center', justifyContent: 'center', gap: 2 },
  apptDot: { width: 4, height: 4, borderRadius: 2 },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  monthView: { paddingHorizontal: 16 },
  monthNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 8 },
  weekdayRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayLabel: { flex: 1, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayDotRow: { height: 5, flexDirection: 'row', alignItems: 'center', gap: 2 },
  monthDot: { width: 4, height: 4, borderRadius: 2 },
  calCard: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginTop: 4 },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  agendaBar: { width: 3, height: 38, borderRadius: 2 },
});

// --- Tab-level Error Boundary wrapper ---
import { TabErrorBoundary } from '@/src/components/TabErrorBoundary';
export default function CalendarScreenWithBoundary() {
  return (
    <TabErrorBoundary tabName="calendar">
      <CalendarScreen />
    </TabErrorBoundary>
  );
}
