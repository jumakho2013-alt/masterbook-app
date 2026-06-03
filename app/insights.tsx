import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  UserPlus,
  CalendarCheck,
  CalendarHeart,
  Wallet,
  Moon,
  Scissors,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, IconButton, Divider, StatusPill } from '@/src/components/ui';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { formatCurrency } from '@/src/utils/currency';
import { toDateKey } from '@/src/utils/date';
import { computeInsights, WEEKDAY_NAMES_RU } from '@/src/lib/insights';
import { findSleepingClients } from '@/src/lib/sleepingClients';

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function InsightsScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();

  const clients = useClientStore((s) => s.clients);
  const appointments = useAppointmentStore((s) => s.appointments);
  const entries = useFinanceStore((s) => s.entries);
  const services = useServiceStore((s) => s.services);

  const data = useMemo(() => {
    const now = new Date();
    const currentMonth = monthKey(now);
    const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const serviceNameById = (id: string) => services.find((s) => s.id === id)?.name;
    const insights = computeInsights({
      clients,
      appointments,
      entries,
      currentMonth,
      lastMonth,
      serviceNameById,
    });
    const sleeping = findSleepingClients({
      clients,
      appointments,
      todayKey: toDateKey(now),
      serviceNameById,
    }).length;
    return { insights, sleeping };
  }, [clients, appointments, entries, services]);

  const { insights, sleeping } = data;

  const deltaPositive = (insights.revenueDeltaPct ?? 0) >= 0;
  const hasAnyData = insights.totalCompleted > 0 || clients.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <Text style={[typo.h3, { color: colors.text }]}>Аналитика</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {!hasAnyData && (
          <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
            Пока мало данных. Добавь клиентов и проведи первые записи — здесь появится статистика по бизнесу.
          </Text>
        )}

        {/* Выручка месяца + дельта к прошлому */}
        <GlassCard elevated style={styles.heroCard}>
          <View style={styles.rowBetween}>
            <Text style={[typo.caption, { color: colors.textSecondary }]}>Выручка за этот месяц</Text>
            <Wallet size={20} color={colors.primary} />
          </View>
          <Text style={[typo.h1, { color: colors.text, marginTop: 4 }]}>
            {formatCurrency(insights.revenueThisMonth)}
          </Text>
          {insights.revenueDeltaPct !== null && (
            <View style={{ marginTop: 8 }}>
              <StatusPill
                label={`${deltaPositive ? '+' : ''}${insights.revenueDeltaPct}% к прошлому месяцу`}
                tone={deltaPositive ? 'good' : 'bad'}
                icon={deltaPositive ? 'up' : 'down'}
              />
            </View>
          )}
        </GlassCard>

        {/* Сетка метрик */}
        <View style={styles.grid}>
          <MetricTile
            icon={<UserPlus size={18} color={colors.primary} />}
            value={String(insights.newClientsThisMonth)}
            label="новых клиентов в этом месяце"
          />
          <MetricTile
            icon={<CalendarCheck size={18} color={colors.primary} />}
            value={String(insights.completedThisMonth)}
            label="визитов проведено за месяц"
          />
          <MetricTile
            icon={<Scissors size={18} color={colors.primary} />}
            value={formatCurrency(insights.avgCheck)}
            label="средний чек за месяц"
          />
          <MetricTile
            icon={<Moon size={18} color={colors.warning} />}
            value={String(sleeping)}
            label="давно не приходили"
          />
        </View>

        {/* Лучший день недели */}
        {insights.bestWeekday !== null && (
          <GlassCard style={styles.infoCard}>
            <CalendarHeart size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>
                {WEEKDAY_NAMES_RU[insights.bestWeekday]} — твой лучший день
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                Больше всего заработано: {formatCurrency(insights.bestWeekdayRevenue)}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Топ услуг */}
        {insights.topServices.length > 0 && (
          <View style={{ marginTop: sp.md }}>
            <Text style={[typo.small, { color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 }]}>
              Топ услуг
            </Text>
            <GlassCard style={{ padding: 0 }}>
              {insights.topServices.map((s, i) => (
                <React.Fragment key={s.serviceId}>
                  {i > 0 && <Divider style={{ marginVertical: 0, marginLeft: 16 }} />}
                  <View style={styles.serviceRow}>
                    <Text style={[typo.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[typo.caption, { color: colors.textSecondary, marginRight: 12 }]}>
                      {s.count} {pluralVisits(s.count)}
                    </Text>
                    <Text style={[typo.bodyBold, { color: colors.text }]}>{formatCurrency(s.revenue)}</Text>
                  </View>
                </React.Fragment>
              ))}
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function pluralVisits(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'визит';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'визита';
  return 'визитов';
}

function MetricTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const { colors, typography: typo } = useTheme();
  return (
    <GlassCard style={styles.tile}>
      {icon}
      <Text style={[typo.h2, { color: colors.text, marginTop: 6 }]}>{value}</Text>
      <Text style={[typo.small, { color: colors.textSecondary, marginTop: 2 }]}>{label}</Text>
    </GlassCard>
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
    marginBottom: 12,
  },
  heroCard: { marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47%', flexGrow: 1, paddingVertical: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
});
