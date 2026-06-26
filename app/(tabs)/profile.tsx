import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Pressable, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from '@/src/lib/haptics';
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
  Globe,
  Users,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Banknote,
  CalendarSync,
  Languages,
  BellRing,
  Camera,
  Vibrate,
} from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { GlassCard, Divider, CustomAlert, useToast } from '@/src/components/ui';
import { MasterBookLogo } from '@/src/components/MasterBookLogo';
import { SyncStatusCard } from '@/src/components/SyncStatusCard';
import { flushPush } from '@/src/lib/cloudSync';
import { persistImageToAppDir, deletePersistedImage } from '@/src/lib/photoStorage';
import { useResolvedPhoto } from '@/src/lib/photoCloud';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { SUPPORTED_CURRENCIES } from '@/src/utils/currency';
import { useClientStore } from '@/src/stores/useClientStore';
import { useAppointmentStore } from '@/src/stores/useAppointmentStore';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useTabBarOffset } from '@/src/hooks/useTabBarOffset';
import { getSpecialization } from '@/src/data/professions';
import { localizeSpecName } from '@/src/data/professions.i18n';

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
        typo.label,
        { color: colors.textTertiary, paddingHorizontal: 24, paddingBottom: 8 },
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
      <View style={[styles.menuTile, { backgroundColor: colors.primarySoft }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[typo.bodyBold, { color: colors.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[typo.small, { color: colors.textTertiary, marginTop: 1 }]}>{subtitle}</Text>
        )}
      </View>
      <ChevronRight size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

/** Строка-переключатель в стиле MenuItem (вместо навигации — Switch). */
function MenuToggle({
  icon,
  label,
  subtitle,
  value,
  onValueChange,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { colors, typography: typo } = useTheme();
  return (
    <View style={styles.menuItem}>
      <View style={[styles.menuTile, { backgroundColor: colors.primarySoft }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[typo.bodyBold, { color: colors.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[typo.small, { color: colors.textTertiary, marginTop: 1 }]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function ProfileScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const bottomOffset = useTabBarOffset(0);
  const masterName = useSettingsStore((s) => s.masterName);
  const masterPhotoUri = useSettingsStore((s) => s.masterPhotoUri);
  const setMasterPhotoUri = useSettingsStore((s) => s.setMasterPhotoUri);
  const resolvedPhoto = useResolvedPhoto(masterPhotoUri);
  const specializationId = useAuthStore((s) => s.specializationId);
  const theme = useSettingsStore((s) => s.theme);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const autoClientReminders = useSettingsStore((s) => s.autoClientReminders);
  const currency = useSettingsStore((s) => s.currency);
  const currencyMeta = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  const restartOnboarding = useAuthStore((s) => s.restartOnboarding);
  const signOut = useAuthStore((s) => s.signOut);
  const resetServices = useServiceStore((s) => s.reset);

  const { alertConfig, info, confirm, show, error: showAlertError } = useAlert();
  const toast = useToast();
  const tr = useT();

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

  const themeLabel = theme === 'light' ? tr('profile.themeLight') : theme === 'dark' ? tr('profile.themeDark') : tr('profile.themeSystem');
  const language = useSettingsStore((s) => s.language);
  const languageLabel = language === 'ru' ? tr('profile.langRu') : language === 'en' ? tr('profile.langEn') : tr('profile.langSystem');

  const localOnly = useAuthStore((s) => s.localOnlyMode);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const handleSignOut = () => {
    confirm(
      tr('profile.signOutTitle'),
      tr('profile.signOutBody'),
      async () => {
        // Перед стиранием локальных сторов дошлём незапушенные правки в облако.
        // Если сети нет — push провалится, и без предупреждения данные пропали
        // бы безвозвратно. В local-only режиме слать некуда — flush = no-op.
        if (userId && !localOnly) {
          const res = await flushPush();
          if (!res.ok) {
            confirm(
              tr('profile.noCloudTitle'),
              tr('profile.noCloudBody'),
              () => signOut(),
              tr('profile.signOutAnyway'),
              true,
            );
            return;
          }
        }
        signOut();
      },
      tr('profile.signOutConfirm'),
      true,
    );
  };

  const handleReset = () => {
    confirm(
      tr('profile.changeProfTitle'),
      tr('profile.changeProfBody'),
      () => {
        // Сбрасываем услуги (они были под старую профессию) и состояние
        // онбординга. session/localOnlyMode НЕ трогаем — юзер остаётся
        // залогиненным. Затем явно навигируем в profession picker.
        resetServices();
        restartOnboarding();
        router.replace('/(auth)/profession');
      },
      tr('profile.changeProfConfirm'),
      true,
    );
  };

  // Фото мастера в профиле. Тот же проверенный флоу, что у клиента:
  // permission → picker → persistImageToAppDir (постоянная папка) → сохранить.
  // Локально, без облака (см. комментарий у masterPhotoUri в useSettingsStore).
  const pickPhoto = async () => {
    // Весь флоу (включая permission-проверки) в одном try: pickPhoto зовётся
    // fire-and-forget из onPress кнопки алерта — без обёртки любой throw из
    // permission API стал бы unhandled rejection (личное правило #12).
    try {
      const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!req.granted) {
          showAlertError(tr('profile.photoAccessTitle'), tr('profile.photoAccessBody'));
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        const prev = masterPhotoUri;
        const persisted = persistImageToAppDir(result.assets[0].uri);
        setMasterPhotoUri(persisted);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success(tr('profile.photoUpdated'));
        // Прежний локальный файл больше не нужен — чистим, чтобы не копить в
        // documentDirectory (cleanup-path; deletePersistedImage no-op для чужих uri).
        if (prev && prev !== persisted) deletePersistedImage(prev);
      }
    } catch (err) {
      showAlertError(tr('profile.photoError'), err instanceof Error ? err.message : String(err));
    }
  };

  const removePhoto = () => {
    const prev = masterPhotoUri;
    setMasterPhotoUri(null);
    if (prev) deletePersistedImage(prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toast.success(tr('profile.photoRemoved'));
  };

  const onPhotoPress = () => {
    // Нет фото — сразу пикер. Есть фото — выбор Заменить / Убрать (2 кнопки:
    // CustomAlert раскладывает их в row с flex:1, третья бы сплющилась).
    if (!masterPhotoUri) {
      pickPhoto();
      return;
    }
    show(
      tr('profile.photoActionTitle'),
      undefined,
      [
        { text: tr('profile.photoChange'), onPress: pickPhoto },
        { text: tr('profile.photoRemove'), style: 'destructive', onPress: removePhoto },
      ],
      'info',
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomOffset + 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[typo.display, { color: colors.text }]}>{tr('profile.title')}</Text>
        </View>

        {/* Profile card — MasterBook logo вместо случайного яркого аватара.
            Аватары хороши для клиентов где много разных людей, но для
            самого мастера brand-identity > random color. */}
        {/* Identity (Atelier): монограмма/фото + серифное имя + специализация */}
        <Animated.View entering={FadeInDown.delay(50)} style={styles.identity}>
          <Pressable
            onPress={onPhotoPress}
            accessibilityRole="button"
            accessibilityLabel={masterPhotoUri ? tr('profile.photoChangeA11y') : tr('profile.photoAddA11y')}
            style={styles.photoWrap}
          >
            {resolvedPhoto ? (
              <Image source={{ uri: resolvedPhoto }} style={[styles.photo, { borderColor: colors.border }]} />
            ) : (
              <MasterBookLogo size={64} />
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Camera size={11} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 26, letterSpacing: -0.3, color: colors.text }} numberOfLines={1}>
              {masterName || tr('profile.masterFallback')}
            </Text>
            <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {spec ? localizeSpecName(spec) : tr('profile.specFallback')}
            </Text>
          </View>
        </Animated.View>

        {/* Публичная страница на сайте-каталоге (мост: приложение → сайт) */}
        <Pressable
          onPress={() => router.push('/publish')}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 22, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
            <Globe size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('settings.publishCardTitle')}</Text>
            <Text style={[typo.small, { color: colors.textTertiary, marginTop: 1 }]}>{tr('settings.publishCardSub')}</Text>
          </View>
          <ChevronRight size={16} color={colors.textTertiary} />
        </Pressable>

        {/* === Раздел: ОБЛАКО === */}
        <SectionLabel title={tr('profile.sectionCloud')} />
        <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <SyncStatusCard />
        </View>

        {/* === Раздел: БИЗНЕС === */}
        <SectionLabel title={tr('profile.sectionBusiness')} />
        <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <GlassCard style={{ padding: 0 }}>
            <MenuItem
              icon={<TrendingUp size={20} color={colors.primary} />}
              label={tr('profile.analytics')}
              subtitle={tr('profile.analyticsSub')}
              onPress={() => router.push('/insights')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Scissors size={20} color={colors.primary} />}
              label={tr('profile.myServices')}
              subtitle={stats.totalClients > 0 ? tr('profile.myServicesSubHas') : tr('profile.myServicesSubEmpty')}
              onPress={() => router.push('/services/manage')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Clock size={20} color={colors.primary} />}
              label={tr('profile.workHours')}
              onPress={() => router.push('/settings/work-hours')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Banknote size={20} color={colors.primary} />}
              label={tr('profile.currency')}
              subtitle={currencyMeta ? `${currencyMeta.name} (${currencyMeta.symbol})` : currency}
              onPress={() => router.push('/settings/currency')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<CalendarSync size={20} color={colors.primary} />}
              label={tr('profile.calendarSync')}
              subtitle={tr('profile.calendarSyncSub')}
              onPress={() => router.push('/settings/calendar-sync')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<BellRing size={20} color={colors.primary} />}
              label={tr('profile.autoReminders')}
              subtitle={autoClientReminders ? tr('profile.autoRemindersOn') : tr('profile.autoRemindersOff')}
              onPress={() => router.push('/settings/reminders')}
            />
          </GlassCard>
        </View>

        {/* === Раздел: ВНЕШНИЙ ВИД === */}
        <SectionLabel title={tr('profile.sectionAppearance')} />
        <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <GlassCard style={{ padding: 0 }}>
            <MenuItem
              icon={<Palette size={20} color={colors.primary} />}
              label={tr('profile.theme')}
              subtitle={themeLabel}
              onPress={toggleTheme}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Languages size={20} color={colors.primary} />}
              label={tr('profile.language')}
              subtitle={languageLabel}
              onPress={() => router.push('/settings/language')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuToggle
              icon={<Vibrate size={20} color={colors.primary} />}
              label={tr('profile.vibration')}
              subtitle={hapticsEnabled ? tr('profile.vibrationOn') : tr('profile.vibrationOff')}
              value={hapticsEnabled}
              onValueChange={(v) => { setHapticsEnabled(v); if (v) Haptics.selectionAsync(); }}
            />
          </GlassCard>
        </View>

        {/* === Раздел: АККАУНТ === */}
        <SectionLabel title={tr('profile.sectionAccount')} />
        <View style={{ paddingHorizontal: 16, marginBottom: sp.md }}>
          <GlassCard style={{ padding: 0 }}>
            <MenuItem
              icon={<ShieldCheck size={20} color={colors.primary} />}
              label={tr('profile.security')}
              subtitle={tr('profile.securitySub')}
              onPress={() => router.push('/settings/account')}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<RefreshCw size={20} color={colors.textSecondary} />}
              label={tr('profile.changeProfession')}
              onPress={handleReset}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<Info size={20} color={colors.textSecondary} />}
              label={tr('profile.about')}
              subtitle="v1.0.0"
              onPress={() => info('MasterBook', tr('profile.aboutBody'))}
            />
            <Divider style={{ marginVertical: 0, marginLeft: 52 }} />
            <MenuItem
              icon={<LogOut size={20} color={colors.danger} />}
              label={tr('profile.signOut')}
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
  photoWrap: {
    width: 64,
    height: 64,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuTile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 22 },
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
