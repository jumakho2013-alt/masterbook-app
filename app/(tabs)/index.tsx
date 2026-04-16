import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, CalendarCheck, TrendingUp, Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { EmptyState, GlassCard, CountUp, LiquidGlass } from '@/src/components/ui';
import { AppointmentCard } from '@/src/components/AppointmentCard';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { formatDateFull, toDateKey } from '@/src/utils/date';
import { formatCurrency } from '@/src/utils/currency';

type Filter = 'upcoming' | 'completed' | 'all';

const FILTER_LABELS: Record<Filter, string> = {
  upcoming: 'Предстоящие',
  completed: 'Завершённые',
  all: 'Все',
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function TodayScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const fabOffset = useTabBarOffset(16);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const appointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);

  const todayKey = toDateKey(new Date());

  // Update "now" every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typo.h1, { color: colors.text }]}>Сегодня</Text>
        <Text style={[typo.body, { color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' }]}>
          {formatDateFull(new Date())}
        </Text>
      </View>

      <FlatList
        data={todayAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: fabOffset + 72 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <>
            {/* Forecast cards */}
            <Animated.View entering={FadeInDown.duration(400)} style={[styles.forecastRow, { marginBottom: sp.md }]}>
              <GlassCard style={styles.forecastCard}>
                <TrendingUp size={16} color={colors.success} />
                <Text style={[typo.small, { color: colors.textSecondary, marginTop: 4 }]}>Сегодня</Text>
                <CountUp
                  value={forecast.todayIncome}
                  style={{ ...typo.h3, color: colors.success }}
                  formatter={(n) => formatCurrency(Math.round(n))}
                />
                <Text style={[typo.small, { color: colors.textTertiary }]}>
                  {forecast.todayCount} записей
                </Text>
              </GlassCard>
              <GlassCard style={styles.forecastCard}>
                <Calendar size={16} color={colors.primary} />
                <Text style={[typo.small, { color: colors.textSecondary, marginTop: 4 }]}>За неделю</Text>
                <CountUp
                  value={forecast.weekIncome}
                  style={{ ...typo.h3, color: colors.primary }}
                  formatter={(n) => formatCurrency(Math.round(n))}
                />
                <Text style={[typo.small, { color: colors.textTertiary }]}>
                  {forecast.weekCount} записей
                </Text>
              </GlassCard>
            </Animated.View>

            {/* "Сейчас" indicator — branded liquid glass with primary tint */}
            {currentAppointment && currentClient && currentService && (
              <Animated.View entering={FadeInDown.delay(50)} style={{ marginBottom: sp.md }}>
                <Pressable
                  onPress={() => router.push(`/appointment/${currentAppointment.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Сейчас идёт: ${currentClient.name}, ${currentService.name}`}
                >
                  <LiquidGlass
                    variant="floating"
                    tint={colors.primary}
                    tintStrength={0.7}
                    radius={br.lg}
                    style={styles.nowCard}
                  >
                    <View style={styles.pulseDot}>
                      <View style={[styles.pulseDotInner, { backgroundColor: colors.white }]} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typo.small, { color: colors.white, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                        Сейчас идёт
                      </Text>
                      <Text style={[typo.bodyBold, { color: colors.white, marginTop: 2 }]}>
                        {currentClient.name} — {currentService.name}
                      </Text>
                      <Text style={[typo.caption, { color: colors.white, opacity: 0.85 }]}>
                        {currentAppointment.startTime} — {currentAppointment.endTime}
                      </Text>
                    </View>
                  </LiquidGlass>
                </Pressable>
              </Animated.View>
            )}

            {/* Filter chips */}
            <View style={[styles.filterRow, { marginBottom: sp.md }]}>
              {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => {
                const active = filter === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setFilter(key)}
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
                      {FILTER_LABELS[key]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<CalendarCheck size={48} color={colors.textTertiary} />}
            title="Нет записей"
            subtitle={
              filter === 'upcoming'
                ? 'На сегодня записей нет. Нажмите + чтобы добавить.'
                : filter === 'completed'
                  ? 'Нет завершённых визитов за сегодня'
                  : 'Пусто'
            }
          />
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(100 + index * 50).duration(400)}>
            <AppointmentCard
              appointment={item}
              client={getClient(item.clientId)}
              service={getService(item.serviceId)}
              onPress={() => router.push(`/appointment/${item.id}`)}
            />
          </Animated.View>
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/appointment/new')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Новая запись"
        style={[styles.fabWrap, { bottom: fabOffset }]}
      >
        <LiquidGlass
          variant="floating"
          tint={colors.primary}
          tintStrength={0.72}
          radius={20}
          style={styles.fab}
        >
          <Plus size={28} color={colors.white} />
        </LiquidGlass>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  forecastRow: { flexDirection: 'row', gap: 12 },
  forecastCard: { flex: 1, alignItems: 'flex-start', paddingVertical: 16 },
  nowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#7C5DFA',
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
    // glass surface a branded glow that anchors it to the theme.
    shadowColor: '#7C5DFA',
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
