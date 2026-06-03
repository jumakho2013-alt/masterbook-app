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
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { getSpecialization } from '@/src/data/professions';
import { formatCurrency } from '@/src/utils/currency';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  subtitle?: string;
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
  const reset = useAuthStore((s) => s.reset);
  const signOut = useAuthStore((s) => s.signOut);

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
    confirm('Начать заново?', 'Все данные будут сброшены. Вы пройдёте онбординг заново.', () => reset(), 'Сбросить', true);
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

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(100)} style={{ paddingHorizontal: 16, marginBottom: sp.lg }}>
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Users size={18} color={colors.primary} />
              <Text style={[typo.h3, { color: colors.text, marginTop: 6 }]}>{stats.totalClients}</Text>
              <Text style={[typo.small, { color: colors.textSecondary }]}>Клиентов</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <CalendarCheck size={18} color={colors.success} />
              <Text style={[typo.h3, { color: colors.text, marginTop: 6 }]}>{stats.totalAppointments}</Text>
              <Text style={[typo.small, { color: colors.textSecondary }]}>Визитов</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <TrendingUp size={18} color={colors.accent} />
              <Text style={[typo.h3, { color: colors.text, marginTop: 6 }]}>{formatCurrency(stats.totalIncome)}</Text>
              <Text style={[typo.small, { color: colors.textSecondary }]}>Доход</Text>
            </GlassCard>
          </View>
        </Animated.View>

        {/* Roadmap teaser — без упоминания цены: реальный IAP ещё не подключён,
            Apple Guideline 3.1.1 запрещает рекламировать платные тиры без StoreKit. */}
        <Animated.View entering={FadeInDown.delay(150)} style={{ paddingHorizontal: 16, marginBottom: sp.lg }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              info(
                'Скоро в MasterBook',
                'Мы добавляем:\n\n• Безлимит клиентов\n• Облачная синхронизация\n• Онлайн-запись для клиентов\n• Финансовые отчёты и PDF для самозанятых\n• Экспорт фото работ\n\nХочешь попробовать первым — напиши на support@masterbook.app',
              )
            }
          >
            <GlassCard elevated style={{ ...styles.proBanner, borderColor: colors.primary + '30' }}>
              <View style={[styles.proIcon, { backgroundColor: colors.primarySoft, borderRadius: br.md }]}>
                <Crown size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: sp.md }}>
                <Text style={[typo.bodyBold, { color: colors.primary }]}>Что добавим дальше</Text>
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Облачная синхронизация, онлайн-запись, отчёты
                </Text>
              </View>
              <ChevronRight size={18} color={colors.primary} />
            </GlassCard>
          </TouchableOpacity>
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInDown.delay(200)} style={{ paddingHorizontal: 16 }}>
          <GlassCard style={{ padding: 0 }}>
            <MenuItem
              icon={<Scissors size={20} color={colors.primary} />}
              label="Мои услуги"
              subtitle="Управление услугами"
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
              icon={<Link size={20} color={colors.primary} />}
              label="Онлайн-запись"
              subtitle="Скоро"
              onPress={() => info('Скоро', 'Онлайн-запись будет доступна в следующем обновлении')}
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
              icon={<Palette size={20} color={colors.primary} />}
              label="Тема"
              subtitle={themeLabel}
              onPress={toggleTheme}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<ShieldCheck size={20} color={colors.primary} />}
              label="Безопасность и данные"
              subtitle="Face ID, экспорт, удаление аккаунта"
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
              subtitle="Версия 1.0.0"
              onPress={() => info('MasterBook', 'Версия 1.0.0\n\nCRM для частных мастеров\n\nСоздано с ❤️')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<LogOut size={20} color={colors.danger} />}
              label="Выйти"
              onPress={handleSignOut}
            />
          </GlassCard>
        </Animated.View>
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
