import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Calendar as CalIcon, Clock, Scissors } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, Divider } from '@/src/components/ui';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useClientStore } from '@/src/stores/useClientStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { formatCurrency } from '@/src/utils/currency';
import { formatDate, toDateKey } from '@/src/utils/date';

type ReportKind = 'income' | 'expense' | 'net' | 'avgCheck' | 'hours';
type Period = 'day' | 'week' | 'month' | 'year';

const REPORT_TITLES: Record<ReportKind, string> = {
  income: 'Доходы',
  expense: 'Расходы',
  net: 'Чистая прибыль',
  avgCheck: 'Средний чек',
  hours: 'Отработано часов',
};

const REPORT_ICONS: Record<ReportKind, React.ComponentType<{ size: number; color: string }>> = {
  income: TrendingUp,
  expense: TrendingDown,
  net: Wallet,
  avgCheck: Scissors,
  hours: Clock,
};

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = toDateKey(now);
  const start = new Date(now);
  if (period === 'day') {
    /* today only */
  } else if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else if (period === 'month') {
    start.setDate(start.getDate() - 30);
  } else {
    start.setFullYear(start.getFullYear() - 1);
  }
  return { start: toDateKey(start), end };
}

/**
 * Детальный отчёт по одной из метрик с Finances. Открывается тапом на
 * соответствующую карточку.
 *
 * Что показывает (по типу отчёта):
 *   • income/expense — список всех транзакций периода с группировкой
 *   • net — income − expense, breakdown по статьям
 *   • avgCheck — список ВСЕХ completed-визитов с ценами, средний по дням
 *   • hours — completed-визиты с длительностями, итог часов
 */
export default function FinanceReportScreen() {
  const router = useRouter();
  const { kind: kindParam, period: periodParam } = useLocalSearchParams<{ kind: string; period: string }>();
  const kind = (kindParam as ReportKind) || 'income';
  const period = (periodParam as Period) || 'month';

  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();

  const allEntries = useFinanceStore((s) => s.entries);
  const allAppointments = useAppointmentStore((s) => s.appointments);
  const clients = useClientStore((s) => s.clients);
  const services = useServiceStore((s) => s.services);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const Icon = REPORT_ICONS[kind];

  // Filter and compute
  const data = useMemo(() => {
    const entries = allEntries.filter((e) => e.date >= range.start && e.date <= range.end);
    const appts = allAppointments.filter(
      (a) => a.status === 'completed' && a.date >= range.start && a.date <= range.end,
    );

    if (kind === 'income') {
      const items = entries
        .filter((e) => e.type === 'income')
        .sort((a, b) => b.date.localeCompare(a.date));
      const total = items.reduce((s, e) => s + e.amount, 0);
      return { items, total, label: 'Доход за период' };
    }
    if (kind === 'expense') {
      const items = entries
        .filter((e) => e.type === 'expense')
        .sort((a, b) => b.date.localeCompare(a.date));
      const total = items.reduce((s, e) => s + e.amount, 0);
      return { items, total, label: 'Расход за период' };
    }
    if (kind === 'net') {
      const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
      const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
      const items = entries.sort((a, b) => b.date.localeCompare(a.date));
      return {
        items,
        total: income - expense,
        label: 'Чистая прибыль (доход − расход)',
        income,
        expense,
      };
    }
    if (kind === 'avgCheck') {
      const total = appts.reduce((s, a) => s + a.price, 0);
      const avg = appts.length > 0 ? Math.round(total / appts.length) : 0;
      const items = appts.sort((a, b) => b.date.localeCompare(a.date));
      return {
        items: items.map((a) => ({
          id: a.id,
          type: 'income' as const,
          amount: a.price,
          description: services.find((s) => s.id === a.serviceId)?.name ?? 'Услуга',
          date: a.date,
        })),
        total: avg,
        label: 'Средний чек',
        apptCount: appts.length,
      };
    }
    if (kind === 'hours') {
      const totalMin = appts.reduce((s, a) => {
        const [sh, sm] = a.startTime.split(':').map(Number);
        const [eh, em] = a.endTime.split(':').map(Number);
        return s + (eh * 60 + em) - (sh * 60 + sm);
      }, 0);
      const totalH = Math.round((totalMin / 60) * 10) / 10;
      return {
        items: appts.sort((a, b) => b.date.localeCompare(a.date)).map((a) => ({
          id: a.id,
          type: 'income' as const,
          amount: 0,
          description: services.find((s) => s.id === a.serviceId)?.name ?? 'Услуга',
          date: a.date,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
        total: totalH,
        label: 'Часов отработано',
        apptCount: appts.length,
      };
    }
    return { items: [], total: 0, label: '' };
  }, [allEntries, allAppointments, services, range, kind]);

  const getClient = (id: string) => clients.find((c) => c.id === id);

  // Day grouping for income/expense/net.
  // Используем общий supertype чтобы TS не ругался на union TypeReports →
  // FinanceEntry | { id, type:'income', amount, description, date }.
  type Item = {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: string;
  };
  const grouped = useMemo(() => {
    const byDate: Record<string, Item[]> = {};
    for (const item of data.items as Item[]) {
      (byDate[item.date] ??= []).push(item);
    }
    return Object.entries(byDate)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.items]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel="Назад"
        />
        <Text style={[typo.h3, { color: colors.text }]}>{REPORT_TITLES[kind]}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <GlassCard elevated style={styles.hero}>
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor:
                    kind === 'income'
                      ? colors.successSoft
                      : kind === 'expense'
                        ? colors.dangerSoft
                        : colors.primarySoft,
                },
              ]}
            >
              <Icon
                size={26}
                color={
                  kind === 'income' ? colors.success : kind === 'expense' ? colors.danger : colors.primary
                }
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[typo.small, { color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
                {data.label}
              </Text>
              <Text
                style={[
                  typo.h1,
                  {
                    color:
                      kind === 'expense' ? colors.danger : kind === 'income' ? colors.success : colors.text,
                    marginTop: 2,
                  },
                ]}
              >
                {kind === 'hours' ? `${data.total} ч` : formatCurrency(data.total)}
              </Text>
              {kind === 'avgCheck' && 'apptCount' in data && (
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  По {data.apptCount} визитам
                </Text>
              )}
              {kind === 'hours' && 'apptCount' in data && (
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  {data.apptCount} визитов
                </Text>
              )}
              {kind === 'net' && 'income' in data && data.income !== undefined && (
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  Доход {formatCurrency(data.income)} · Расход {formatCurrency(data.expense ?? 0)}
                </Text>
              )}
            </View>
          </GlassCard>
        </View>

        {/* Period info */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CalIcon size={14} color={colors.textSecondary} />
            <Text style={[typo.caption, { color: colors.textSecondary }]}>
              {formatDate(range.start)} — {formatDate(range.end)}
            </Text>
          </View>
        </View>

        {/* Day-grouped list */}
        {grouped.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={[typo.body, { color: colors.textSecondary }]}>За период данных нет</Text>
          </View>
        ) : (
          grouped.map(({ date, items }) => {
            const dayTotal = items.reduce(
              (s, e) => s + (e.type === 'income' ? e.amount : -e.amount),
              0,
            );
            return (
              <View key={date}>
                <View style={[styles.dayHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[typo.small, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                    {formatDate(date)}
                  </Text>
                  {kind !== 'hours' && kind !== 'avgCheck' && (
                    <Text
                      style={[
                        typo.small,
                        {
                          color: dayTotal >= 0 ? colors.success : colors.danger,
                          fontFamily: typo.bodyBold.fontFamily,
                        },
                      ]}
                    >
                      {dayTotal >= 0 ? '+' : ''}
                      {formatCurrency(dayTotal)}
                    </Text>
                  )}
                </View>
                {items.map((item, i) => (
                  <View key={item.id} style={[styles.row, { paddingHorizontal: 20 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typo.body, { color: colors.text }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <Text
                      style={[
                        typo.bodyBold,
                        {
                          color: item.type === 'income' ? colors.success : colors.danger,
                        },
                      ]}
                    >
                      {item.amount > 0
                        ? (item.type === 'income' ? '+' : '−') + formatCurrency(item.amount)
                        : ''}
                    </Text>
                  </View>
                ))}
                <Divider style={{ marginVertical: 0 }} />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  hero: { flexDirection: 'row', alignItems: 'center' },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
