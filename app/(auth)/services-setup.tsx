import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Button, GlassCard } from '@/src/components/ui';
import { serviceTemplates } from '@/src/data/service-templates';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { supabase } from '@/src/lib/supabase';
import { formatCurrency } from '@/src/utils/currency';
import { generateId } from '@/src/utils/helpers';
import type { Service } from '@/src/types';

export default function ServicesSetupScreen() {
  const router = useRouter();
  const { specializationId } = useLocalSearchParams<{ specializationId: string }>();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const [services, setServices] = useState<Service[]>([]);
  const [masterName, setMasterName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const templates = serviceTemplates[specializationId ?? ''] ?? [];
    setServices(templates.map((t) => ({ ...t, id: generateId() })));
  }, [specializationId]);

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const finish = async () => {
    setLoading(true);
    try {
      // Save master name
      if (masterName.trim()) {
        useSettingsStore.getState().setMasterName(masterName.trim());
      }

      // Save services to store
      const store = useServiceStore.getState();
      services.forEach((s) => store.addService(s));

      // Sync profile to Supabase (don't block onboarding on failure)
      try {
        const authState = useAuthStore.getState();
        if (authState.user) {
          await supabase.from('profiles').upsert({
            id: authState.user.id,
            name: masterName.trim(),
            profession_category: authState.professionCategory,
            specialization_id: authState.specializationId,
          });
        }
      } catch (err) {
        console.warn('Profile sync failed, will retry later');
      }

      setOnboarded(true);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => {
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={[typo.h2, { color: colors.text }]}>
          Ваши услуги
        </Text>
        <Text style={[typo.body, { color: colors.textSecondary, marginTop: sp.xs }]}>
          Мы подобрали шаблоны. Отредактируйте или удалите ненужные.
        </Text>
        <Text style={[typo.bodyBold, { color: colors.text, marginTop: sp.md }]}>Ваше имя</Text>
        <TextInput
          value={masterName}
          onChangeText={setMasterName}
          placeholder="Введите ваше имя"
          placeholderTextColor={colors.textTertiary}
          style={[typo.body, styles.nameInput, { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: 12 }]}
        />
      </Animated.View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 32 }]}>
            Нет услуг. Вы сможете добавить их позже.
          </Text>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
            <GlassCard style={styles.serviceCard}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <View style={styles.serviceInfo}>
                <Text style={[typo.bodyBold, { color: colors.text }]}>{item.name}</Text>
                <Text style={[typo.caption, { color: colors.textSecondary }]}>
                  {formatCurrency(item.price)} / {item.duration} мин
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeService(item.id)} hitSlop={12}>
                <X size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}
      />

      <View style={styles.bottom}>
        <Button title="Готово" onPress={finish} size="lg" loading={loading} disabled={loading} style={{ width: '100%' }} />
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={[typo.body, { color: colors.textSecondary }]}>Добавлю позже</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  serviceInfo: { flex: 1 },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  nameInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
});
