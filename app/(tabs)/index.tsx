import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, CalendarCheck, TrendingUp, Calendar, Bell } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { EmptyState, GlassCard, CountUp, Button, useToast } from '@/src/components/ui';
import { AtelierScheduleRow } from '@/src/components/AtelierScheduleRow';
import { SleepingClientsCard } from '@/src/components/SleepingClientsCard';
import { TrialBanner } from '@/src/components/TrialBanner';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { formatDateFull, toDateKey } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';
import { nowMinutesOfDay, timeToMinutes } from '@/src/utils/time';
import { seedSampleData } from '@/src/lib/sampleData';
import { useProfessionPack } from '@/src/hooks/useProfessionPack';
import { useT } from '@/src/hooks/useT';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { syncDeleteEvent } from '@/src/lib/calendarSync';
import type { Appointment } from '@/src/types';

/** Русские склонения числительных. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

type Filter = 'upcoming' | 'completed' | 'all';

// i18n-ключи фильтров (резолвятся в рендере через useT).
const FILTER_KEYS: Record<Filter, string> = {
  upcoming: 'today.filterUpcoming',
  completed: 'today.filterCompleted',
  all: 'today.filterAll',
};

function TodayScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br, isDark } = useTheme();
  const fabOffset = useTabBarOffset(16);
  const reduceMotion = useReduceMotion();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(() => nowMinutesOfDay());

  const appointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);
  const demoDataSeededAt = useSettingsStore((s) => s.demoDataSeededAt);
  const toast = useToast();
  const { pack } = useProfessionPack();
  const tr = useT();

  // Полностью пустое состояние: ни клиентов, ни услуг, ни записей — самый
  // первый запуск после онбординга, либо user только что почистил всё.
  const isCompletelyEmpty =
    clients.length === 0 && services.length === 0 && appointments.length === 0;

  const onTrySample = useCallback(() => {
    const ok = seedSampleData();
    if (ok) toast.success(tr('today.sampleLoaded'));
    else toast.error(tr('today.sampleHasData'));
  }, [toast, tr]);

  // Quick-complete: тап на ✓ в карточке → запись становится «проведено»,
  // доход автоматически записан в финансы, toast подтверждает.
  // Это главный «daily ritual» — каждый клиент приходит → один тап → готово.
  const setApptStatus = useAppointmentStore((s) => s.setStatus);
  const addFinanceEntry = useFinanceStore((s) => s.addEntry);
  const handleQuickComplete = useCallback(
    (appt: Appointment) => {
      setApptStatus(appt.id, 'completed');
      // Предотвращаем double-recording если уже записано
      const existingEntries = useFinanceStore.getState().entries;
      const alreadyRecorded = existingEntries.some((e) => e.appointmentId === appt.id);
      if (!alreadyRecorded) {
        // Используем store.getState() напрямую — getClient/getService
        // объявлены ниже в файле, инициализированы при первом render.
        const client = clients.find((c) => c.id === appt.clientId);
        const service = services.find((s) => s.id === appt.serviceId);
        addFinanceEntry({
          type: 'income',
          amount: appt.price,
          description: `${service?.name ?? 'Услуга'} — ${client?.name ?? 'Клиент'}`,
          date: appt.date,
          appointmentId: appt.id,
        });
      }
      toast.success(tr('today.completedToast', { amount: formatCurrency(appt.price) }));
    },
    [setApptStatus, addFinanceEntry, clients, services, toast, tr],
  );

  const todayKey = toDateKey(new Date());

  // Update "now" every minute — двигает индикатор «сейчас идёт».
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMinutes(nowMinutesOfDay());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        if (a.date !== todayKey) return false;
        if (filter === 'all') return true;
        if (filter === 'completed') return a.status === 'completed';
        return a.status === 'scheduled';
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, todayKey, filter]);

  // Find "now" appointment (currently in progress)
  const currentAppointment = useMemo(() => {
    return appointments.find((a) => {
      if (a.date !== todayKey || a.status !== 'scheduled') return false;
      const start = timeToMinutes(a.startTime);
      const end = timeToMinutes(a.endTime);
      return nowMinutes >= start && nowMinutes < end;
    });
  }, [appointments, todayKey, nowMinutes]);

  // Income forecast
  const forecast = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const endKey = toDateKey(weekEnd);

    const upcoming = appointments.filter(
      (a) => a.date >= todayKey && a.date <= endKey && a.status === 'scheduled',
    );
    const todayIncome = upcoming.filter((a) => a.date === todayKey).reduce((s, a) => s + a.price, 0);
    const weekIncome = upcoming.reduce((s, a) => s + a.price, 0);
    const weekCount = upcoming.length;

    return { todayIncome, weekIncome, weekCount, todayCount: upcoming.filter((a) => a.date === todayKey).length };
  }, [appointments, todayKey]);

  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getService = (id: string) => services.find((s) => s.id === id);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const currentClient = currentAppointment ? getClient(currentAppointment.clientId) : null;
  const currentService = currentAppointment ? getService(currentAppointment.serviceId) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={[styles.header, styles.headerRow]}>
        <View style={{ flex: 1 }}>
          <Text style={[typo.label, { color: colors.textTertiary }]}>
            {formatDateFull(new Date())}
          </Text>
          <Text style={[typo.display, { color: colors.text, marginTop: 2 }]}>{tr('today.title')}</Text>
        </View>
        {/* Колокольчик (по макету Atelier) → авто-напоминания клиентам. */}
        <Pressable
          onPress={() => router.push('/settings/reminders')}
          accessibilityRole="button"
          accessibilityLabel={tr('profile.autoReminders')}
          style={[styles.bellBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Bell size={19} color={colors.textSecondary} strokeWidth={1.5} />
          <View style={[styles.bellDot, { backgroundColor: colors.gold, borderColor: colors.background }]} />
        </Pressable>
      </View>

      <FlatList
        data={todayAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: fabOffset + 72 }}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: 8 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <>
            {/* Compact forecast — один блок, не два больших.
                Показываем числа только если есть записи. Если 0 — мягкая
                подсказка вместо нулей-кричалок. */}
            {forecast.todayCount > 0 || forecast.weekCount > 0 ? (
              <Animated.View
                entering={reduceMotion ? undefined : FadeInDown.duration(400)}
                style={{ marginBottom: sp.md }}
              >
                <GlassCard style={styles.forecastInline}>
                  <View style={styles.forecastSegment}>
                    <Text style={[typo.label, { color: colors.textTertiary }]}>
                      {tr('today.forecastToday')}
                    </Text>
                    <CountUp
                      value={forecast.todayIncome}
                      style={{ ...typo.numberLg, color: colors.success, marginTop: 2 }}
                      formatter={(n) => formatCurrency(Math.round(n))}
                    />
                    <Text style={[typo.small, { color: colors.textSecondary, marginTop: 2 }]}>
                      {forecast.todayCount} {plural(forecast.todayCount, tr('today.recOne'), tr('today.recFew'), tr('today.recMany'))}
                    </Text>
                  </View>
                  <View style={[styles.forecastDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.forecastSegment}>
                    <Text style={[typo.label, { color: colors.textTertiary }]}>
                      {tr('today.forecastWeek')}
                    </Text>
                    <CountUp
                      value={forecast.weekIncome}
                      style={{ ...typo.numberLg, color: colors.text, marginTop: 2 }}
                      formatter={(n) => formatCurrency(Math.round(n))}
                    />
                    <Text style={[typo.small, { color: colors.textSecondary, marginTop: 2 }]}>
                      {forecast.weekCount} {plural(forecast.weekCount, tr('today.recOne'), tr('today.recFew'), tr('today.recMany'))}
                    </Text>
                  </View>
                </GlassCard>
              </Animated.View>
            ) : null}

            {/* "Сейчас" indicator — branded liquid glass with primary tint */}
            {currentAppointment && currentClient && currentService && (
              <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(50)} style={{ marginBottom: sp.md }}>
                <Pressable
                  onPress={() => router.push(`/appointment/${currentAppointment.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={tr('today.nowOngoingA11y', { client: currentClient.name, service: currentService.name })}
                >
                  <View style={[styles.nowCard, { backgroundColor: isDark ? '#2A2230' : '#241E29', borderRadius: br.lg }]}>
                    <View style={[styles.pulseDot, { backgroundColor: 'rgba(219,186,124,0.32)' }]}>
                      <View style={[styles.pulseDotInner, { backgroundColor: colors.gold }]} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                      <Text style={[typo.label, { color: 'rgba(255,255,255,0.6)' }]}>{tr('today.nowOngoing')}</Text>
                      <Text numberOfLines={1} style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 23, letterSpacing: -0.3, color: '#FFFFFF', marginTop: 3 }}>
                        {currentClient.name}
                      </Text>
                      <Text numberOfLines={1} style={[typo.caption, { color: 'rgba(255,255,255,0.6)', marginTop: 1 }]}>
                        {currentService.name} · {currentAppointment.endTime}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: colors.gold, marginLeft: 10 }}>
                      {formatCurrency(currentAppointment.price)}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {/* Filter chips — показываем только при ≥6 записях.
                При меньшем — список и так короткий, фильтры лишний шум. */}
            {(() => {
              const todayApptsRaw = appointments.filter((a) => a.date === todayKey);
              const shouldShowFilters = todayApptsRaw.length >= 6 || filter !== 'upcoming';
              if (!shouldShowFilters) return null;
              return (
                <View style={[styles.filterRow, { marginBottom: sp.md }]}>
                  {(Object.keys(FILTER_KEYS) as Filter[]).map((key) => {
                    const active = filter === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setFilter(key)}
                        accessibilityRole="button"
                        accessibilityLabel={tr('today.filterA11y', { label: tr(FILTER_KEYS[key]) })}
                        accessibilityState={{ selected: active }}
                        hitSlop={{ top: 6, bottom: 6 }}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active ? colors.primary : colors.surfaceElevated,
                            borderRadius: br.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typo.caption,
                            { color: active ? colors.white : colors.textSecondary },
                          ]}
                        >
                          {tr(FILTER_KEYS[key])}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })()}

            {/* Подписка: баннер триала/истечения (null если подписан или
                триал в начале). Жёсткий гейт — с реальным IAP. */}
            <TrialBanner />

            {/* Спящие клиенты — nudge-блок. Возвращает null если все
                клиенты активны, поэтому не съедает место без причины. */}
            <SleepingClientsCard />

            {/* Заголовок списка «на сегодня» с прогрессом проведённых —
                делает Today читаемым как чеклист дня. */}
            {(() => {
              const todayAll = appointments.filter((a) => a.date === todayKey);
              if (todayAll.length === 0) return null;
              const done = todayAll.filter((a) => a.status === 'completed').length;
              return (
                <View style={styles.dayListHeader}>
                  <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: colors.text }}>
                    {tr('today.scheduleTitle')}
                  </Text>
                  <Text style={[typo.caption, { color: colors.textSecondary }]}>
                    {tr('today.doneOfCount', { done, total: todayAll.length })}
                  </Text>
                </View>
              );
            })()}
          </>
        }
        ListEmptyComponent={
          // Если у юзера вообще нет ни одного клиента/услуги/записи —
          // показываем sample-data CTA. Это first-run путь когда онбординг
          // прошёл но реальных данных ещё нет.
          isCompletelyEmpty && !demoDataSeededAt ? (
            <View style={{ paddingHorizontal: 16 }}>
              <EmptyState
                icon={<CalendarCheck size={48} color={colors.textTertiary} />}
                title={pack.emptyStates.today?.title ?? tr('today.emptyTitle')}
                subtitle={pack.emptyStates.today?.subtitle ?? tr('today.emptySampleSubtitle')}
              />
              <Button
                title={tr('today.tryWithSample')}
                variant="primary"
                onPress={onTrySample}
                fullWidth
                style={{ marginTop: 8 }}
              />
              <Text
                style={[
                  typo.small,
                  { color: colors.textTertiary, textAlign: 'center', marginTop: 8 },
                ]}
              >
                {tr('today.sampleDetails')}
              </Text>
            </View>
          ) : (
            <EmptyState
              icon={<CalendarCheck size={48} color={colors.textTertiary} />}
              title={tr('today.noneTitle')}
              subtitle={
                filter === 'upcoming'
                  ? tr('today.emptyUpcoming')
                  : filter === 'completed'
                    ? tr('today.emptyCompleted')
                    : tr('today.emptyAll')
              }
            />
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100 + index * 50).duration(400)}>
            <AtelierScheduleRow
              appointment={item}
              client={getClient(item.clientId)}
              service={getService(item.serviceId)}
              onPress={() => router.push(`/appointment/${item.id}`)}
              onQuickComplete={() => handleQuickComplete(item)}
            />
          </Animated.View>
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/appointment/new')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={tr('today.newAppointment')}
        style={[styles.fabWrap, { bottom: fabOffset }]}
      >
        <View style={[styles.fab, { backgroundColor: colors.primary, borderRadius: 20 }]}>
          <Plus size={28} color={isDark ? '#2A2030' : colors.white} />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 6, height: 6, borderRadius: 3, borderWidth: 1 },
  dayListHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  forecastInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  forecastSegment: {
    flex: 1,
    alignItems: 'flex-start',
  },
  forecastDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 16,
  },
  nowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#6B4E71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  fabWrap: {
    position: 'absolute',
    right: 20,
    // Coloured drop-shadow matching the primary tint — gives the liquid
    // glass surface a branded emerald glow that anchors it to the theme.
    shadowColor: '#6B4E71',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  fab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// --- Tab-level Error Boundary wrapper ---
import { TabErrorBoundary } from '@/src/components/TabErrorBoundary';
export default function TodayScreenWithBoundary() {
  return (
    <TabErrorBoundary tabName="today">
      <TodayScreen />
    </TabErrorBoundary>
  );
}
