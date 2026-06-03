import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ChevronRight,
  Scissors,
  Clock,
  Palette,
  Info,
  Link,
  Crown,
  Users,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Banknote,
  Star,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, Avatar, Divider, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { SUPPORTED_CURRENCIES } from '@/src/utils/currency';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { getSpecialization } from '@/src/data/professions';
import { formatCurrency } from '@/src/utils/currency';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  subtitle?: string;
}

/** Section label — group header в стиле iOS settings. */
function SectionLabel({ title }: { title: string }) {
  const { colors, typography: typo } = useTheme();
  return (
    <Text
      style={[
        typo.small,
        {
          color: colors.textTertiary,
          paddingHorizontal: 24,
          paddingBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
      ]}
    >
      {title}
    </Text>
  );
}

function MenuItem({ icon, label, onPress, subtitle }: MenuItemProps) {
  const { colors, typography: typo } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.menuItem}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={[typo.body, { color: colors.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[typo.small, { color: colors.textTertiary, marginTop: 1 }]}>{subtitle}</Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

function ProfileScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const bottomOffset = useTabBarOffset(0);
  const masterName = useSettingsStore((s) => s.masterName);
  const specializationId = useAuthStore((s) => s.specializationId);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const currency = useSettingsStore((s) => s.currency);
  const currencyMeta = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const restartOnboarding = useAuthStore((s) => s.restartOnboarding);
  const signOut = useAuthStore((s) => s.signOut);
  const resetServices = useServiceStore((s) => s.reset);

  const { alertConfig, info, confirm } = useAlert();

  const clients = useClientStore((s) => s.clients);
  const appointments = useAppointmentStore((s) => s.appointments);
  const entries = useFinanceStore((s) => s.entries);

  const spec = specializationId ? getSpecialization(specializationId) : null;

  // Stats
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalAppointments = appointments.filter((a) => a.status === 'completed').length;
    const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    return { totalClients, totalAppointments, totalIncome };
  }, [clients, appointments, entries]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const themeLabel = theme === 'light' ? 'Светлая' : theme === 'dark' ? 'Тёмная' : 'Системная';

  const handleSignOut = () => {
    confirm(
      'Выйти из аккаунта?',
      'Данные на этом устройстве будут стёрты (облачная синхронизация будет в следующем обновлении). Сделать экспорт перед выходом — Профиль → Безопасность и данные → Экспорт.',
      () => signOut(),
      'Выйти',
      true,
    );
  };

  const handleReset = () => {
    confirm(
      'Сменить профессию?',
      'Список твоих услуг будет очищен — для новой профессии подгрузятся свои шаблоны. Клиенты, записи и финансы останутся на месте.',
      () => {
        // Сбрасываем услуги (они были под старую профессию) и состояние
        // онбординга. session/localOnlyMode НЕ трогаем — юзер остаётся
        // залогиненным. Затем явно навигируем в profession picker.
        resetServices();
        restartOnboarding();
        router.replace('/(auth)/profession');
      },
      'Сменить',
      true,
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomOffset + 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[typo.h2, { color: colors.text }]}>Профиль</Text>
        </View>

        {/* Profile card */}
        <Animated.View entering={FadeInDown.delay(50)} style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <GlassCard elevated style={styles.profileCard}>
            <Avatar name={masterName || 'Мастер'} size={64} />
            <View style={{ marginLeft: sp.md, flex: 1 }}>
              <Text style={[typo.h3, { color: colors.text }]}>
                {masterName || 'Мастер'}
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {spec?.name ?? 'Специализация'}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Compact stats row — inline numbers, не три большие карточки */}
        <View style={[styles.compactStatsRow, { paddingHorizontal: 16, marginBottom: sp.lg }]}>
          <View style={styles.compactStat}>
            <Text style={[typo.h3, { color: colors.text }]}>{stats.totalClients}</Text>
            <Text style={[typo.small, { color: colors.textSecondary }]}>клиентов</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.compactStat}>
            <Text style={[typo.h3, { color: colors.text }]}>{stats.totalAppointments}</Text>
            <Text style={[typo.small, { color: colors.textSecondary }]}>визитов</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.compactStat}>
            <Text style={[typo.h3, { color: colors.text }]}>{formatCurrency(stats.totalIncome)}</Text>
            <Text style={[typo.small, { color: colors.textSecondary }]}>заработано</Text>
          </View>
        </View>

        {/* === Раздел: БИЗНЕС === */}
        <SectionLabel title="Бизнес" />
        <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <GlassCard style={{ padding: 0 }}>
            <MenuItem
              icon={<Scissors size={20} color={colors.primary} />}
              label="Мои услуги"
              subtitle={`${stats.totalClients > 0 ? 'Прайс-лист и длительности' : 'Создай свой прайс'}`}
              onPress={() => router.push('/services/manage')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Clock size={20} color={colors.primary} />}
              label="Рабочее время"
              onPress={() => router.push('/settings/work-hours')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Banknote size={20} color={colors.primary} />}
              label="Валюта"
              subtitle={currencyMeta ? `${currencyMeta.name} (${currencyMeta.symbol})` : currency}
              onPress={() => router.push('/settings/currency')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Star size={20} color={colors.primary} />}
              label="Ссылка для отзывов"
              subtitle="После визита — попросить отзыв"
              onPress={() => router.push('/settings/review-link')}
            />
          </GlassCard>
        </View>

        {/* === Раздел: ВНЕШНИЙ ВИД === */}
        <SectionLabel title="Внешний вид" />
        <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <GlassCard style={{ padding: 0 }}>
            <MenuItem
              icon={<Palette size={20} color={colors.primary} />}
              label="Тема"
              subtitle={themeLabel}
              onPress={toggleTheme}
            />
          </GlassCard>
        </View>

        {/* === Раздел: АККАУНТ === */}
        <SectionLabel title="Аккаунт" />
        <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <GlassCard style={{ padding: 0 }}>
            <MenuItem
              icon={<ShieldCheck size={20} color={colors.primary} />}
              label="Безопасность и данные"
              subtitle="Face ID, экспорт, удаление"
              onPress={() => router.push('/settings/account')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<RefreshCw size={20} color={colors.textSecondary} />}
              label="Сменить профессию"
              onPress={handleReset}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Info size={20} color={colors.textSecondary} />}
              label="О приложении"
              subtitle="v1.0.0"
              onPress={() => info('MasterBook', 'Версия 1.0.0\n\nCRM для частных мастеров')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<LogOut size={20} color={colors.danger} />}
              label="Выйти"
              onPress={handleSignOut}
            />
          </GlassCard>
        </View>
      </ScrollView>
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactStat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});

// --- Tab-level Error Boundary wrapper ---
import { TabErrorBoundary } from '@/src/components/TabErrorBoundary';
export default function ProfileScreenWithBoundary() {
  return (
    <TabErrorBoundary tabName="profile">
      <ProfileScreen />
    </TabErrorBoundary>
  );
}
