import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import { Button } from '@/src/components/ui';
import { MasterBookLogo } from '@/src/components/MasterBookLogo';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.logoWrap}>
          <MasterBookLogo size={96} />

        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={[typo.h1, { color: colors.text, textAlign: 'center' }]}>
            MasterBook
          </Text>
          <Text
            style={[
              typo.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: sp.sm },
            ]}
          >
            {'Все клиенты, записи и доходы\nв одном приложении'}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.bottom}>
        <Button
          title="Начать"
          onPress={() => router.push('/(auth)/profession')}
          size="lg"
          style={{ width: '100%' }}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
