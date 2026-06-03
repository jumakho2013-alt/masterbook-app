import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown, Trophy, Clock, Scissors, Plus } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, Divider, Avatar, CountUp, LiquidGlass } from '@/src/components/ui';
import { FinanceChart } from '@/src/components/FinanceChart';
import { FinanceMetricCard } from '@/src/components/FinanceMetricCard';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { formatCurrency } from '@/src/utils/currency';
import { toDateKey, formatDate } from '@/src/utils/date';

type Period = 'day' | 'week' | 'month';

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = toDateKey(now);
  const start = new Date(now);

  if (period === 'day') {
    // today only
  } else if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }

  return { start: toDateKey(start), end };
}

function getPreviousRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'day') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (period === 'week') {
    start.setDate(start.getDate() - 14);
    end.setDate(end.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 60);
    end.setDate(end.getDate() - 30);
  }
  return { start: toDateKey(start), end: toDateKey(end) };
}

const periodLabels: Record<Period, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
};

function FinancesScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const bottomOffset = useTabBarOffset(0);
  const fabOffset = useTabBarOffset(16);
  const [period, setPeriod] = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);
  const allEntries = useFinanceStore((s) => s.entries);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPreviousRange(period), [period]);

  // Группировка транзакций по дням — сначала свежие.
  const groupedEntries = useMemo(() => {
    const filtered = allEntries
      .filter((e) => e.date >= range.start && e.date <= range.end)
      .sort((a, b) => b.date.localeCompare(a.date));
    const byDate: Record<string, typeof filtered> = {};
    for (const e of filtered) {
      (byDate[e.date] ??= []).push(e);
    }
    return Object.entries(byDate).map(([date, data]) => ({
      title: date,
      data,
      dayTotal: data.reduce(
        (s, e) => s + (e.type === 'income' ? e.amount : -e.amount),
        0,
      ),
    }));
  }, [allEntries, range]);

  const entries = useMemo(
    () => allEntries.filter((e) => e.date >= range.start && e.date <= range.end).sort((a, b) => b.date.localeCompare(a.date)),
    [allEntries, range],
  );

  const prevEntries = useMemo(
    () => allEntries.filter((e) => e.date >= prevRange.start && e.date <= prevRange.end),
    [allEntries, prevRange],
  );

  const summary = useMemo(() => {
    const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const prevIncome = prevEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const incomeDiff = prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : 0;
    return { income, expense, net: income - expense, prevIncome, incomeDiff };
  }, [entries, prevEntries]);

  // Analytics for the period
  const analytics = useMemo(() => {
    const periodAppts = allAppointments.filter(
      (a) => a.status === 'completed' && a.date >= range.start && a.date <= range.end,
    );

    // Average check
    const avgCheck = periodAppts.length > 0
      ? Math.round(periodAppts.reduce((s, a) => s + a.price, 0) / periodAppts.length)
      : 0;

    // Work hours (sum of appointment durations)
    const totalMinutes = periodAppts.reduce((sum, a) => {
      const [sh, sm] = a.startTime.split(':').map(Number);
      const [eh, em] = a.endTime.split(':').map(Number);
      return sum + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);
    const hours = Math.floor(totalMinutes / 60);

    // Top clients
    const clientRevenue: Record<string, number> = {};
    periodAppts.forEach((a) => {
      clientRevenue[a.clientId] = (clientRevenue[a.clientId] ?? 0) + a.price;
    });
    const topClients = Object.entries(clientRevenue)
      .map(([id, revenue]) => ({ client: clients.find((c) => c.id === id), revenue }))
      .filter((t) => t.client)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Popular service
    const serviceCount: Record<string, number> = {};
    periodAppts.forEach((a) => {
      serviceCount[a.serviceId] = (serviceCount[a.serviceId] ?? 0) + 1;
    });
    const popularEntry = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];
    const popularService = popularEntry
      ? { service: services.find((s) => s.id === popularEntry[0]), count: popularEntry[1] }
      : null;

    return { avgCheck, hours, topClients, popularService, totalAppts: periodAppts.length };
  }, [allAppointments, range, clients, services]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // Весь «верхний» layout (табы периода, summary, chart, top-clients,
  // популярная услуга) — фиксирован и не зависит от количества транзакций.
  // Выносим его в ListHeaderComponent и отдаём FlatList виртуализировать
  // именно транзакции — их может быть сотни после пары месяцев работы.
  const listHeader = (
    <>
      {/* Period tabs */}
        <View style={styles.periodRow}>
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodTab,
                {
                  backgroundColor: p === period ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderRadius: 10,
                },
              ]}
            >
              <Text style={[typo.caption, { color: p === period ? colors.white : colors.textSecondary }]}>
                {periodLabels[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* === HERO: Чистая прибыль — large card во всю ширину === */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <FinanceMetricCard
            variant="large"
            label="Чистая прибыль"
            icon={<Wallet size={20} color={colors.primary} />}
            value={summary.net}
            accentColor={colors.primary}
            sub={
              summary.incomeDiff !== 0
                ? `${summary.incomeDiff > 0 ? '↗' : '↘'} ${Math.abs(summary.incomeDiff)}% к прошлому периоду`
                : 'Доход − Расход'
            }
            onPress={() => router.push({ pathname: '/finance/report', params: { kind: 'net', period } })}
          />
        </View>

        {/* === 2 compact: Доход + Расход === */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <FinanceMetricCard
              label="Доход"
              icon={<TrendingUp size={18} color={colors.success} />}
              value={summary.income}
              accentColor={colors.success}
              onPress={() => router.push({ pathname: '/finance/report', params: { kind: 'income', period } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FinanceMetricCard
              label="Расход"
              icon={<TrendingDown size={18} color={colors.danger} />}
              value={summary.expense}
              accentColor={colors.danger}
              onPress={() => router.push({ pathname: '/finance/report', params: { kind: 'expense', period } })}
            />
          </View>
        </View>

        {/* === 2 compact: Средний чек + Отработано === */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 }}
        >
          <View style={{ flex: 1 }}>
            <FinanceMetricCard
              label="Средний чек"
              icon={<Wallet size={18} color={colors.primary} />}
              value={analytics.avgCheck}
              accentColor={colors.primary}
              onPress={() => router.push({ pathname: '/finance/report', params: { kind: 'avgCheck', period } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FinanceMetricCard
              label="Отработано"
              icon={<Clock size={18} color={colors.accent} />}
              value={`${analytics.hours} ч`}
              accentColor={colors.accent}
              onPress={() => router.push({ pathname: '/finance/report', params: { kind: 'hours', period } })}
            />
          </View>
        </Animated.View>

        {/* Top 3 clients */}
        {analytics.topClients.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100)} style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Trophy size={16} color={colors.warning} />
                <Text style={[typo.bodyBold, { color: colors.text }]}>Топ клиенты</Text>
              </View>
              {analytics.topClients.map((t, i) => (
                <View key={t.client!.id} style={[styles.topRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                  <Text style={[typo.bodyBold, { color: colors.textTertiary, width: 24 }]}>
                    #{i + 1}
                  </Text>
                  <Avatar name={t.client!.name} size={36} photoUri={t.client!.photoUri} />
                  <Text style={[typo.body, { color: colors.text, flex: 1, marginLeft: 10 }]} numberOfLines={1}>
                    {t.client!.name}
                  </Text>
                  <Text style={[typo.bodyBold, { color: colors.success }]}>
                    {formatCurrency(t.revenue)}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        )}

        {/* Popular service */}
        {analytics.popularService?.service && (
          <Animated.View entering={FadeInDown.delay(150)} style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.popularIcon, { backgroundColor: colors.primarySoft, borderRadius: br.md }]}>
                  <Scissors size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typo.small, { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                    Популярная услуга
                  </Text>
                  <Text style={[typo.bodyBold, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>
                    {analytics.popularService.service.name}
                  </Text>
                </View>
                <Text style={[typo.h3, { color: colors.primary }]}>
                  {analytics.popularService.count}x
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Chart */}
        {period !== 'day' && entries.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <GlassCard>
              <FinanceChart entries={entries} days={period === 'week' ? 7 : 30} />
            </GlassCard>
          </View>
        )}

      {entries.length > 0 && (
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.sm, marginBottom: sp.sm, paddingHorizontal: 16 }]}>
          Транзакции
        </Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typo.h2, { color: colors.text }]}>Финансы</Text>
      </View>

      <SectionList
        sections={groupedEntries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={() => <Divider style={{ marginVertical: 0 }} />}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: bottomOffset + 88 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.daySectionHeader,
              { backgroundColor: colors.surface, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[typo.small, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
              {formatDate(section.title)}
            </Text>
            <Text
              style={[
                typo.small,
                {
                  color: section.dayTotal >= 0 ? colors.success : colors.danger,
                  fontFamily: typo.bodyBold.fontFamily,
                },
              ]}
            >
              {section.dayTotal >= 0 ? '+' : ''}{formatCurrency(section.dayTotal)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.txRow, { paddingHorizontal: 16 }]}>
            <View style={styles.txInfo}>
              <Text style={[typo.body, { color: colors.text }]} numberOfLines={1}>
                {item.description}
              </Text>
            </View>
            <Text
              style={[
                typo.bodyBold,
                { color: item.type === 'income' ? colors.success : colors.danger },
              ]}
            >
              {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
            </Text>
          </View>
        )}
      />

      {/* FAB — добавить расход / доход. Главный gap из user feedback:
          «где я добавляю расход купила лак за 1500₽?» */}
      <TouchableOpacity
        onPress={() => router.push('/finance/new')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Добавить операцию"
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
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  periodTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    padding: 12,
    alignItems: 'flex-start',
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  analyticsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  analyticsCard: {
    flex: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  popularIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fabWrap: {
    position: 'absolute',
    right: 20,
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

// --- Tab-level Error Boundary wrapper ---
import { TabErrorBoundary } from '@/src/components/TabErrorBoundary';
export default function FinancesScreenWithBoundary() {
  return (
    <TabErrorBoundary tabName="finances">
      <FinancesScreen />
    </TabErrorBoundary>
  );
}
