import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown, Trophy, Clock, Scissors } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, Divider, Avatar, CountUp } from '@/src/components/ui';
import { FinanceChart } from '@/src/components/FinanceChart';
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

export default function FinancesScreen() {
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const bottomOffset = useTabBarOffset(0);
  const [period, setPeriod] = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);
  const allEntries = useFinanceStore((s) => s.entries);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPreviousRange(period), [period]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typo.h2, { color: colors.text }]}>Финансы</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomOffset + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
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

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <GlassCard style={styles.summaryCard}>
              <TrendingUp size={18} color={colors.success} />
              <Text style={[typo.small, { color: colors.textSecondary, marginTop: 4 }]}>Доход</Text>
              <CountUp
                value={summary.income}
                style={{ ...typo.h3, color: colors.success }}
                formatter={(n) => formatCurrency(Math.round(n))}
              />
              {summary.incomeDiff !== 0 && (
                <View style={styles.diffRow}>
                  {summary.incomeDiff > 0 ? (
                    <ArrowUp size={11} color={colors.success} />
                  ) : (
                    <ArrowDown size={11} color={colors.danger} />
                  )}
                  <Text
                    style={[
                      typo.small,
                      { color: summary.incomeDiff > 0 ? colors.success : colors.danger, marginLeft: 2 },
                    ]}
                  >
                    {Math.abs(summary.incomeDiff)}%
                  </Text>
                </View>
              )}
            </GlassCard>
          </View>
          <View style={{ flex: 1 }}>
            <GlassCard style={styles.summaryCard}>
              <TrendingDown size={18} color={colors.danger} />
              <Text style={[typo.small, { color: colors.textSecondary, marginTop: 4 }]}>Расход</Text>
              <CountUp
                value={summary.expense}
                style={{ ...typo.h3, color: colors.danger }}
                formatter={(n) => formatCurrency(Math.round(n))}
              />
            </GlassCard>
          </View>
          <View style={{ flex: 1 }}>
            <GlassCard style={styles.summaryCard}>
              <Wallet size={18} color={colors.primary} />
              <Text style={[typo.small, { color: colors.textSecondary, marginTop: 4 }]}>Чистыми</Text>
              <CountUp
                value={summary.net}
                style={{ ...typo.h3, color: colors.text }}
                formatter={(n) => formatCurrency(Math.round(n))}
              />
            </GlassCard>
          </View>
        </View>

        {/* Analytics row */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.analyticsRow}>
          <GlassCard style={styles.analyticsCard}>
            <Wallet size={16} color={colors.primary} />
            <CountUp
              value={analytics.avgCheck}
              style={{ ...typo.h3, color: colors.text, marginTop: 4 }}
              formatter={(n) => formatCurrency(Math.round(n))}
            />
            <Text style={[typo.small, { color: colors.textSecondary }]}>Средний чек</Text>
          </GlassCard>
          <GlassCard style={styles.analyticsCard}>
            <Clock size={16} color={colors.accent} />
            <CountUp
              value={analytics.hours}
              style={{ ...typo.h3, color: colors.text, marginTop: 4 }}
              suffix=" ч"
            />
            <Text style={[typo.small, { color: colors.textSecondary }]}>Отработано</Text>
          </GlassCard>
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
                  <Text style={[typo.bodyBold, { color: colors.text, marginTop: 2 }]}>
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

        {/* Transactions */}
        <View style={{ paddingHorizontal: 16 }}>
          {entries.length > 0 && (
            <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.sm, marginBottom: sp.sm }]}>
              Транзакции
            </Text>
          )}
          {entries.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <Divider style={{ marginVertical: 0 }} />}
              <View style={styles.txRow}>
                <View style={styles.txInfo}>
                  <Text style={[typo.body, { color: colors.text }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={[typo.caption, { color: colors.textSecondary }]}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                <Text
                  style={[
                    typo.bodyBold,
                    { color: item.type === 'income' ? colors.success : colors.danger },
                  ]}
                >
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
});
