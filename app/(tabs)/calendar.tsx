import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { AppointmentCard } from '@/src/components/AppointmentCard';
import { EmptyState } from '@/src/components/ui';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays } from 'lucide-react-native';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { toDateKey, getDayOfWeekShort, getDayNumber, getMonthName } from '@/src/utils/date';

type ViewMode = 'week' | 'month';

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

function getMonthGrid(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // JS: 0=Sun, we want 0=Mon
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const grid: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(new Date(year, month, d));
  }
  return grid;
}

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function CalendarScreen() {
  const router = useRouter();
  const { colors, typography: typo, borderRadius: br, spacing: sp } = useTheme();
  const bottomOffset = useTabBarOffset(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);

  const weekDays = getWeekDays(selectedDate);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);

  // Days with appointments (for dots)
  const daysWithAppts = useMemo(() => {
    const set = new Set<string>();
    allAppointments.forEach((a) => {
      if (a.status === 'scheduled' || a.status === 'completed') {
        set.add(a.date);
      }
    });
    return set;
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[typo.h2, { color: colors.text }]}>Календарь</Text>
          <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' }]}>
            {getMonthName(viewMode === 'month' ? monthCursor : selectedDate)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={goToToday}
            style={[styles.todayBtn, { backgroundColor: colors.primarySoft, borderRadius: br.sm }]}
          >
            <Text style={[typo.caption, { color: colors.primary, fontFamily: typo.bodyBold.fontFamily }]}>
              Сегодня
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            style={[styles.modeBtn, { backgroundColor: colors.surfaceElevated, borderRadius: br.sm }]}
          >
            {viewMode === 'week' ? (
              <LayoutGrid size={16} color={colors.textSecondary} />
            ) : (
              <CalendarDays size={16} color={colors.textSecondary} />
            )}
          </Pressable>
        </View>
      </View>

      {viewMode === 'week' ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
            {weekDays.map((day) => {
              const key = toDateKey(day);
              const selected = isSelectedDay(day);
              const today = isToday(day);
              const hasAppts = daysWithAppts.has(key);

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
                  {hasAppts && (
                    <View
                      style={[
                        styles.apptDot,
                        { backgroundColor: selected ? colors.white : colors.primary },
                      ]}
                    />
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

          {/* Weekday labels */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={[typo.small, styles.weekdayLabel, { color: colors.textTertiary }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Month grid */}
          <View style={styles.monthGrid}>
            {monthGrid.map((day, i) => {
              if (!day) {
                return <View key={`empty-${i}`} style={styles.monthCell} />;
              }
              const key = toDateKey(day);
              const selected = isSelectedDay(day);
              const today = isToday(day);
              const hasAppts = daysWithAppts.has(key);

              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedDate(day)}
                  style={styles.monthCell}
                >
                  <View
                    style={[
                      styles.monthDayInner,
                      {
                        backgroundColor: selected ? colors.primary : 'transparent',
                        borderRadius: br.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typo.body,
                        {
                          color: selected ? colors.white : today ? colors.primary : colors.text,
                          fontFamily: today || selected ? typo.bodyBold.fontFamily : typo.body.fontFamily,
                        },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                    {hasAppts && (
                      <View
                        style={[
                          styles.monthDot,
                          { backgroundColor: selected ? colors.white : colors.primary },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomOffset + 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<CalendarIcon size={48} color={colors.textTertiary} />}
            title="Нет записей"
            subtitle="На этот день записей нет"
          />
        }
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            client={getClient(item.clientId)}
            service={getService(item.serviceId)}
            onPress={() => router.push(`/appointment/${item.id}`)}
          />
        )}
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
  apptDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  monthView: { paddingHorizontal: 16 },
  monthNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 8 },
  weekdayRow: { flexDirection: 'row', marginBottom: 8 },
  weekdayLabel: { flex: 1, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  monthDayInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
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
