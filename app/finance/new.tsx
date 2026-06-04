import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { Button, Input, IconButton, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useFinanceStore } from '@/src/stores/useFinanceStore';
import { toDateKey } from '@/src/utils/date';

/**
 * Экран добавления финансовой операции — расход или доход.
 * Главный use-case: «купила лак за 1500₽» — мастер должен иметь возможность
 * быстро занести расход без привязки к записи.
 */
export default function NewFinanceEntryScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const addEntry = useFinanceStore((s) => s.addEntry);
  const tr = useT();

  const { alertConfig, error: showError } = useAlert();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const onSubmit = () => {
    Keyboard.dismiss();
    const num = parseFloat(amount.replace(',', '.').replace(/\s/g, ''));
    if (!Number.isFinite(num) || num <= 0) {
      showError(tr('misc.financeNewInvalidTitle'), tr('misc.financeNewInvalidBody'));
      return;
    }
    const desc = description.trim() || (type === 'expense' ? tr('finances.expense') : tr('finances.income'));
    addEntry({
      type,
      amount: num,
      description: desc,
      date: toDateKey(new Date()),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <IconButton
          icon={<ArrowLeft size={22} color={colors.text} />}
          onPress={() => router.back()}
          variant="ghost"
          accessibilityLabel={tr('misc.financeNewClose')}
        />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('misc.financeNewTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Тип: расход / доход — большая визуальная развилка */}
        <View style={[styles.typeRow, { gap: sp.sm }]}>
          <TypeButton
            label={tr('finances.expense')}
            icon={<TrendingDown size={20} color={type === 'expense' ? colors.white : colors.danger} />}
            active={type === 'expense'}
            activeColor={colors.danger}
            onPress={() => setType('expense')}
          />
          <TypeButton
            label={tr('finances.income')}
            icon={<TrendingUp size={20} color={type === 'income' ? colors.white : colors.success} />}
            active={type === 'income'}
            activeColor={colors.success}
            onPress={() => setType('income')}
          />
        </View>

        <Input
          label={tr('misc.financeNewAmount')}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          autoFocus
          containerStyle={{ marginTop: sp.lg }}
        />
        <Input
          label={tr('misc.financeNewDescription')}
          placeholder={type === 'expense' ? tr('misc.financeNewDescPlaceholderExpense') : tr('misc.financeNewDescPlaceholderIncome')}
          value={description}
          onChangeText={setDescription}
          containerStyle={{ marginTop: sp.md }}
        />

        <Button
          title={tr('common.save')}
          onPress={onSubmit}
          size="lg"
          fullWidth
          variant={type === 'expense' ? 'danger' : 'primary'}
          style={{ marginTop: sp.xl }}
        />
      </ScrollView>
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

function TypeButton({
  label,
  icon,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  const { colors, typography: typo, borderRadius: br } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[
        styles.typeButton,
        {
          backgroundColor: active ? activeColor : colors.surfaceElevated,
          borderRadius: br.md,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          typo.bodyBold,
          { color: active ? colors.white : colors.text, marginLeft: 8 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  typeRow: { flexDirection: 'row' },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
});
