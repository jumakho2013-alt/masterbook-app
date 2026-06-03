import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { ProfessionCard } from '@/src/components/ProfessionCard';
import { professionCategories } from '@/src/data/professions';
import { useAuthStore } from '@/src/stores/useAuthStore';

export default function ProfessionScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const setProfession = useAuthStore((s) => s.setProfession);

  const handleSelect = (categoryId: string) => {
    const category = professionCategories.find((c) => c.id === categoryId);
    if (!category) return;

    // If only one specialization (like "other"), skip specialization screen
    if (category.specializations.length === 1) {
      setProfession(category.id, category.specializations[0].id);
      router.push({
        pathname: '/(auth)/services-setup',
        params: { specializationId: category.specializations[0].id },
      });
      return;
    }

    router.push({
      pathname: '/(auth)/specialization',
      params: { categoryId },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={[typo.h1, { color: colors.text }]}>
          {'Чем вы\nзанимаетесь?'}
        </Text>
      </Animated.View>

      <FlatList
        data={professionCategories}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(100 + index * 80).duration(400)}
            style={styles.gridItem}
          >
            <ProfessionCard
              name={item.name}
              icon={item.icon}
              color={item.color}
              onPress={() => handleSelect(item.id)}
            />
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
});
