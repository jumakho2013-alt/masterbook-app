import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Fingerprint, Download, Trash2, ShieldAlert } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { GlassCard, Divider, IconButton, CustomAlert, Button } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { authenticate, biometricLabel, getBiometricKind, type BiometricKind } from '@/src/lib/biometric';
import { exportDataToFile } from '@/src/lib/exportData';
import { deleteAccount } from '@/src/lib/deleteAccount';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const biometricLock = useSettingsStore((s) => s.biometricLock);
  const setBiometricLock = useSettingsStore((s) => s.setBiometricLock);

  const { alertConfig, info, error: showError, confirm } = useAlert();

  const [kind, setKind] = useState<BiometricKind>('unknown');
  const [exporting, setExporting] = useState(false);
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
        'Недоступно',
        'Биометрия не настроена на устройстве. Включите Face ID / Touch ID / отпечаток в настройках системы.',
      );
      return;
    }

    if (biometricLock) {
      // Выключение — требуем подтверждения биометрией, иначе злоумышленник
      // с разблокированным экраном отключит защиту одним тапом.
      const res = await authenticate('Подтвердите чтобы выключить защиту');
      if (!res.success) return;
      setBiometricLock(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const res = await authenticate(`Включить вход по ${bioLabel}`);
      if (!res.success) {
        if (!res.cancelled) showError('Не удалось проверить биометрию');
        return;
      }
      setBiometricLock(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const onExport = async () => {
    setExporting(true);
    const res = await exportDataToFile();
    setExporting(false);
    if (!res.ok) {
      showError('Экспорт не удался', res.error);
    }
  };

  const onDelete = () => {
    confirm(
      'Удалить аккаунт?',
      'Это необратимое действие. Все ваши клиенты, записи и финансы будут удалены. Отменить нельзя.',
      async () => {
        // Второе подтверждение биометрией если доступна — добавочная
        // защита, чтобы дети/коллеги в разблокированном телефоне
        // случайно не стёрли CRM.
        if (bioAvailable) {
          const res = await authenticate('Подтвердите удаление аккаунта');
          if (!res.success) return;
        }
        setDeleting(true);
        const res = await deleteAccount();
        setDeleting(false);
        if (!res.ok) {
          showError('Не удалось удалить аккаунт', res.error);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        // После wipe — ведём на логин (Index перенаправит, т.к. сессии нет).
        router.replace('/');
      },
      'Удалить',
      true,
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel="Назад"
        />
        <Text style={[typo.h3, { color: colors.text }]}>Безопасность и данные</Text>
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
                Вход по {bioLabel}
              </Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {bioAvailable
                  ? 'Запрашивать биометрию при открытии приложения'
                  : 'Недоступно на этом устройстве'}
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

        {/* Export */}
        <GlassCard style={styles.section}>
          <TouchableOpacity onPress={onExport} disabled={exporting} activeOpacity={0.7} style={styles.row}>
            <View style={styles.rowIcon}>
              <Download size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>Экспорт данных</Text>
              <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                Сохранить клиентов, записи и финансы в JSON
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
              Опасная зона
            </Text>
          </View>
          <GlassCard style={{ padding: 16 }}>
            <Text style={[typo.body, { color: colors.text }]}>
              Удалить аккаунт
            </Text>
            <Text style={[typo.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              Все ваши данные будут навсегда удалены. Это действие нельзя отменить.
            </Text>
            <Button
              title="Удалить аккаунт"
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
