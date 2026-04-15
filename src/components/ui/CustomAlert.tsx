import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/src/theme';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle, AlertTriangle, XCircle, Info, HelpCircle,
} from 'lucide-react-native';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertConfig {
  visible: boolean;
  title: string;
  message?: string;
  icon?: 'success' | 'warning' | 'error' | 'info' | 'confirm';
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const ICONS = {
  success: { Icon: CheckCircle, color: '#2ED573' },
  warning: { Icon: AlertTriangle, color: '#FFA502' },
  error: { Icon: XCircle, color: '#FF4757' },
  info: { Icon: Info, color: '#7C5DFA' },
  confirm: { Icon: HelpCircle, color: '#7C5DFA' },
};

export function CustomAlert({
  visible,
  title,
  message,
  icon = 'info',
  buttons,
  onDismiss,
}: AlertConfig) {
  const { colors, typography: typo, borderRadius: br, spacing: sp } = useTheme();

  const resolvedButtons = buttons ?? [{ text: 'OK', style: 'default' as const }];
  const iconInfo = ICONS[icon];

  const handlePress = (btn: AlertButton) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btn.onPress?.();
    onDismiss?.();
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onDismiss} />
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: br.xl,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: iconInfo.color + '15' }]}>
            <iconInfo.Icon size={32} color={iconInfo.color} />
          </View>

          {/* Title */}
          <Text style={[typo.h3, { color: colors.text, textAlign: 'center', marginTop: sp.md }]}>
            {title}
          </Text>

          {/* Message */}
          {message && (
            <Text
              style={[
                typo.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: sp.sm, lineHeight: 22 },
              ]}
            >
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={[styles.buttons, { marginTop: sp.lg }]}>
            {resolvedButtons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;

              return (
                <Pressable
                  key={i}
                  onPress={() => handlePress(btn)}
                  style={[
                    styles.button,
                    {
                      backgroundColor: isDestructive
                        ? colors.danger
                        : isPrimary
                          ? colors.primary
                          : 'transparent',
                      borderRadius: br.md,
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: colors.border,
                      flex: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typo.bodyBold,
                      {
                        color: isCancel ? colors.textSecondary : '#FFFFFF',
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '85%',
    maxWidth: 340,
    padding: 28,
    alignItems: 'center',
    borderWidth: 0.5,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
