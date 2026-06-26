import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Fingerprint, Download, FileText, Eraser, Trash2, ShieldAlert } from 'lucide-react-native';
import * as Haptics from '@/src/lib/haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, Divider, IconButton, CustomAlert, Button, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { authenticate, biometricLabel, getBiometricKind, type BiometricKind } from '@/src/lib/biometric';
import { exportDataToFile } from '@/src/lib/exportData';
import { generateAndShareTaxReport, currentMonthRange } from '@/src/lib/taxReportPdf';
import { clearAllBusinessData } from '@/src/lib/sampleData';
import { deleteAccount } from '@/src/lib/deleteAccount';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const setBiometricLock = useSettingsStore((s) => s.setBiometricLock);
  const demoDataSeededAt = useSettingsStore((s) => s.demoDataSeededAt);
  const toast = useToast();

  const { alertConfig, info, error: showError, confirm, show } = useAlert();

  const [kind, setKind] = useState<BiometricKind>('unknown');
  const [exporting, setExporting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Проверяем железо один раз при открытии — переопределяется редко и
    // переключение настроек требует актуального состояния для подсказки.
    getBiometricKind().then(setKind);
  }, []);

  const bioAvailable = kind !== 'none';
  const bioLabel = biometricLabel(kind);

  const toggleBiometric = async () => {
    if (!bioAvailable) {
      info(
        tr('settings.accountBiometricUnavailableTitle'),
        tr('settings.accountBiometricUnavailableBody'),
      );
      return;
    }

    if (biometricLock) {
      // Выключение — требуем подтверждения биометрией, иначе злоумышленник
      // с разблокированным экраном отключит защиту одним тапом.
      const res = await authenticate(tr('settings.accountBiometricConfirmDisable'));
      if (!res.success) return;
      setBiometricLock(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const res = await authenticate(tr('settings.accountBiometricConfirmEnable', { method: bioLabel }));
      if (!res.success) {
        if (!res.cancelled) showError(tr('settings.accountBiometricCheckFailed'));
        return;
      }
      setBiometricLock(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const onClearDemo = () => {
    confirm(
      tr('settings.accountClearDemoTitle'),
      tr('settings.accountClearDemoBody'),
      () => {
        clearAllBusinessData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success(tr('settings.accountClearDemoDone'));
      },
      tr('settings.accountClearDemoConfirm'),
      true,
    );
  };

  const onTaxReport = async () => {
    setGeneratingPdf(true);
    const res = await generateAndShareTaxReport(currentMonthRange());
    setGeneratingPdf(false);
    if (!res.ok) {
      showError(tr('settings.accountTaxReportFailed'), res.error);
    }
  };

  const onExport = async () => {
    setExporting(true);
    const res = await exportDataToFile();
    setExporting(false);
    if (!res.ok) {
      showError(tr('settings.accountExportFailed'), res.error);
    }
  };

  const onDelete = () => {
    confirm(
      tr('settings.accountDeleteConfirmTitle'),
      tr('settings.accountDeleteConfirmBody'),
      async () => {
        // Второе подтверждение биометрией если доступна — добавочная
        // защита, чтобы дети/коллеги в разблокированном телефоне
        // случайно не стёрли CRM.
        if (bioAvailable) {
          const res = await authenticate(tr('settings.accountDeleteBiometric'));
          if (!res.success) return;
        }
        setDeleting(true);
        const res = await deleteAccount();
        setDeleting(false);
        if (!res.ok) {
          showError(tr('settings.accountDeleteFailed'), res.error);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (res.serverDeleteFailed) {
          // Локальный wipe прошёл, но запись на сервере осталась.
          // Apple Guideline 5.1.1(v): нельзя сделать вид что аккаунт удалён —
          // нужно прозрачно сказать пользователю что делать. Redirect только
          // после того как пользователь прочитает и закроет alert.
          show(
            tr('settings.accountDeleteServerFailedTitle'),
            tr('settings.accountDeleteServerFailedBody', { error: res.serverError }),
            [{ text: tr('common.ok'), onPress: () => router.replace('/') }],
            'warning',
          );
          return;
        }
        // После wipe — ведём на логин (Index перенаправит, т.к. сессии нет).
        router.replace('/');
      },
      tr('common.delete'),
      true,
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel={tr('common.back')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('settings.accountTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Biometric lock */}
        <GlassCard style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Fingerprint size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>
                {tr('settings.accountBiometricLogin', { method: bioLabel })}
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {bioAvailable
                  ? tr('settings.accountBiometricOn')
                  : tr('settings.accountBiometricUnavailable')}
              </Text>
            </View>
            <Switch
              value={biometricLock}
              onValueChange={toggleBiometric}
              disabled={!bioAvailable}
              trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
            />
          </View>
        </GlassCard>

        {/* Очистить демо — отображается ТОЛЬКО если демо-данные действительно
            были засеяны через UI. Иначе пункт-призрак раздражал бы пользователя. */}
        {demoDataSeededAt && (
          <GlassCard style={styles.section}>
            <TouchableOpacity onPress={onClearDemo} activeOpacity={0.7} style={styles.row}>
              <View style={styles.rowIcon}>
                <Eraser size={22} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('settings.accountClearDemo')}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {tr('settings.accountClearDemoSub')}
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Tax PDF report — CIS-specific feature, моат против Booksy/Fresha */}
        <GlassCard style={styles.section}>
          <TouchableOpacity onPress={onTaxReport} disabled={generatingPdf} activeOpacity={0.7} style={styles.row}>
            <View style={styles.rowIcon}>
              <FileText size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('settings.accountTaxReport')}</Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {tr('settings.accountTaxReportSub')}
              </Text>
            </View>
            {generatingPdf ? <ActivityIndicator color={colors.primary} /> : null}
          </TouchableOpacity>
        </GlassCard>

        {/* Export */}
        <GlassCard style={styles.section}>
          <TouchableOpacity onPress={onExport} disabled={exporting} activeOpacity={0.7} style={styles.row}>
            <View style={styles.rowIcon}>
              <Download size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('settings.accountExport')}</Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {tr('settings.accountExportSub')}
              </Text>
            </View>
            {exporting ? <ActivityIndicator color={colors.primary} /> : null}
          </TouchableOpacity>
        </GlassCard>

        {/* Danger zone */}
        <View style={styles.dangerBlock}>
          <View style={styles.dangerHeader}>
            <ShieldAlert size={16} color={colors.danger} />
            <Text style={[typo.caption, { color: colors.danger, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
              {tr('settings.accountDangerZone')}
            </Text>
          </View>
          <GlassCard style={{ padding: 16 }}>
            <Text style={[typo.body, { color: colors.text }]}>
              {tr('settings.accountDeleteTitle')}
            </Text>
            <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {tr('settings.accountDeleteSub')}
            </Text>
            <Button
              title={tr('settings.accountDeleteTitle')}
              onPress={onDelete}
              variant="danger"
              size="md"
              fullWidth
              loading={deleting}
              style={{ marginTop: sp.md }}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBlock: {
    marginTop: 16,
    gap: 8,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});
